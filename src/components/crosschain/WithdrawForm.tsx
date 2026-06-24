import { useEffect, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import type { MidenAccount, EVMToMidenIntentParams } from "../../types/miden";
import { MIDEN_DESTINATION_CHAIN_ID } from "../../constants/chains";
import { getTestnetChainName } from "../../constants/chains";
import {
  formatQuoteTokenIn,
  type EVMToMidenQuote,
} from "../../services/epoch-bridge";
import { truncateHash } from "../../lib/explorers";
import {
  EPOCH_TESTNET_TOKENS,
  findEvmToken,
  type EvmToken,
} from "../../constants/evm-tokens";
import { toast } from "sonner";

export const WITHDRAW_DEPOSIT_TOAST_ID = "withdraw-deposit";
export const WITHDRAW_SETTLE_TOAST_ID = "withdraw-settle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// SIO testnet mocks are deployed with 18 decimals across the board — even
// tokens that have 6 decimals on mainnet (USDC/USDT). See `constants/evm-tokens.ts`.
const TESTNET_TOKENS: EvmToken[] = [
  ...EPOCH_TESTNET_TOKENS,
  { symbol: "Custom", address: "", decimals: 18 },
];

const TOKEN_CUSTOM = "__custom__";
// Fallback decimals for custom (unknown) EVM tokens.
const CUSTOM_TOKEN_DEFAULT_DECIMALS = 18;

interface Props {
  accounts: MidenAccount[];
  onFetchQuote: (params: EVMToMidenIntentParams) => Promise<void>;
  onConfirmWithdraw: () => Promise<unknown>;
  onClearQuote: () => void;
  pendingQuote: EVMToMidenQuote | null;
  isFetchingQuote: boolean;
  isLoading: boolean;
  isSDKReady: boolean;
}

export function WithdrawForm({
  accounts,
  onFetchQuote,
  onConfirmWithdraw,
  onClearQuote,
  pendingQuote,
  isFetchingQuote,
  isLoading,
  isSDKReady,
}: Props) {
  const [evmToken, setEvmToken] = useState(TESTNET_TOKENS[0].address);
  const [customToken, setCustomToken] = useState("");
  const [minTokenOut, setMinTokenOut] = useState("1000000");
  const [midenRecipientId, setMidenRecipientId] = useState(
    () => accounts[0]?.id ?? "",
  );
  const [midenFaucetId, setMidenFaucetId] = useState(
    "0x2458e5446128e6b150b75b8ebd9ce1",
  );
  const [status, setStatus] = useState("");

  const { address: connectedAddress } = useAccount();
  const walletChainId = useChainId();

  useEffect(() => {
    if (!midenRecipientId && accounts[0]?.id) {
      setMidenRecipientId(accounts[0].id);
    }
  }, [accounts, midenRecipientId]);

  const tokenSelectValue = evmToken === "" ? TOKEN_CUSTOM : evmToken;
  const resolvedFaucetId = midenFaucetId.trim();

  const finalToken = customToken || evmToken;
  // Resolve decimals via the canonical EVM token map first (case-insensitive
  // address match). Custom / unknown tokens fall back to 18 — the SIO testnet
  // default. Do NOT trust a stale entry from `TESTNET_TOKENS` matched by exact
  // string equality; the canonical lookup is normalized.
  const selectedToken = findEvmToken(finalToken);
  const evmTokenDecimals =
    selectedToken?.decimals ?? CUSTOM_TOKEN_DEFAULT_DECIMALS;
  const evmDisplayDecimals = evmTokenDecimals;

  const buildParams = (): EVMToMidenIntentParams => {
    if (!connectedAddress) {
      throw new Error("Connect EVM wallet first");
    }
    return {
      sourceChainId: walletChainId,
      destinationChainId: MIDEN_DESTINATION_CHAIN_ID,
      evmSourceAddress: connectedAddress,
      evmTokenAddress: finalToken,
      evmTokenDecimals,
      midenRecipientId,
      midenFaucetId: resolvedFaucetId,
      minTokenOut: minTokenOut.trim(),
    };
  };

  const canQuote =
    isSDKReady &&
    !!connectedAddress &&
    walletChainId > 0 &&
    !!midenRecipientId &&
    !!resolvedFaucetId &&
    !!(customToken || evmToken) &&
    minTokenOut.trim() !== "" &&
    minTokenOut.trim() !== "0" &&
    true;

  const handleGetQuote = () => {
    if (
      !finalToken ||
      finalToken === "0x0000000000000000000000000000000000000000"
    ) {
      toast.error("Select or enter a valid source token address");
      return;
    }
    void toast.promise(
      (async () => {
        setStatus("Fetching withdraw quote…");
        await onFetchQuote(buildParams());
        setStatus("Quote ready — review below, then confirm.");
        return "Quote ready";
      })(),
      {
        loading: "Fetching quote…",
        success: (msg) => msg,
        error: (err) => {
          const msg = err instanceof Error ? err.message : "Quote failed";
          setStatus(msg);
          return msg;
        },
      },
    );
  };

  const handleConfirm = async () => {
    // Two-stage toast: (1) Compact deposit signature/confirmation,
    // (2) SIO Miden settlement — dismissed by parent WithdrawTab once the
    // synthetic Miden row appears in the status poll.
    setStatus("Awaiting Compact deposit signature in wallet…");
    toast.loading("Sign Compact deposit in wallet…", {
      id: WITHDRAW_DEPOSIT_TOAST_ID,
    });
    try {
      const result = await onConfirmWithdraw();
      if (
        result &&
        typeof result === "object" &&
        "error" in result &&
        (result as { error?: string }).error
      ) {
        throw new Error((result as { error: string }).error);
      }

      const depositHash = (result as any)?.solveResult?.depositResult
        ?.transactionHash as string | undefined;

      if (depositHash) {
        toast.success(
          `Compact deposit confirmed · ${truncateHash(depositHash)}`,
          {
            id: WITHDRAW_DEPOSIT_TOAST_ID,
          },
        );
        setStatus(
          `Deposit confirmed (${truncateHash(depositHash)}) — polling for Miden settlement…`,
        );
      } else {
        toast.success("Intent submitted", { id: WITHDRAW_DEPOSIT_TOAST_ID });
        setStatus("Intent submitted — polling for Miden settlement…");
      }

      // Hold a loading toast until the parent component sees a Miden settlement row.
      toast.loading("Waiting for SIO Miden settlement…", {
        id: WITHDRAW_SETTLE_TOAST_ID,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Error: ${msg}`, { id: WITHDRAW_DEPOSIT_TOAST_ID });
      toast.dismiss(WITHDRAW_SETTLE_TOAST_ID);
      setStatus(`Error: ${msg}`);
    }
  };

  return (
    <div className="ui-card">
      <h2 className="text-base font-semibold text-neutral-900">
        Intent details
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">
        Pay ERC-20 on the EVM chain below, set min Miden out, then{" "}
        <strong>Get quote</strong> (same allocator flow as Cross-chain deposit).
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <Label>Source EVM token ({getTestnetChainName(walletChainId)})</Label>
          <SelectRoot
            value={tokenSelectValue}
            onValueChange={(v) => {
              if (v === TOKEN_CUSTOM) {
                setEvmToken("");
                setCustomToken("");
              } else {
                setEvmToken(v);
                setCustomToken("");
              }
              onClearQuote();
            }}
          >
            <SelectTrigger aria-label="Select EVM token">
              <SelectValue placeholder="Token" />
            </SelectTrigger>
            <SelectContent>
              {TESTNET_TOKENS.map((token) => (
                <SelectItem
                  key={token.symbol}
                  value={token.address === "" ? TOKEN_CUSTOM : token.address}
                >
                  {token.symbol}
                  {token.address ? ` · ${token.address.slice(0, 10)}…` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </SelectRoot>
        </div>

        {evmToken === "" && (
          <div>
            <Label htmlFor="wd-custom">Custom token address</Label>
            <Input
              id="wd-custom"
              value={customToken}
              onChange={(e) => {
                setCustomToken(e.target.value);
                onClearQuote();
              }}
              placeholder="0x…"
              className="font-mono text-[13px]"
            />
          </div>
        )}

        <div>
          <Label htmlFor="wd-min-token-out">
            Min Miden tokens to receive{" "}
            <span className="text-xs font-normal text-neutral-500">
              (base units — maps directly to intent{" "}
              <code className="text-[11px]">minTokenOut</code>)
            </span>
          </Label>
          <Input
            id="wd-min-token-out"
            value={minTokenOut}
            onChange={(e) => {
              setMinTokenOut(e.target.value);
              onClearQuote();
            }}
            placeholder="e.g. 10"
          />
        </div>

        <div>
          <Label>EVM source wallet</Label>
          <div className="mt-1 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-[13px] text-neutral-600 break-all">
            {connectedAddress ?? (
              <span className="text-amber-700">Connect EVM wallet above</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Destination (Miden wallet)</Label>
            <Input
              type="text"
              value={midenRecipientId}
              onChange={(e) => setMidenRecipientId(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="wd-faucet-id">Miden faucet ID</Label>
            <Input
              id="wd-faucet-id"
              value={midenFaucetId}
              onChange={(e) => {
                setMidenFaucetId(e.target.value);
                onClearQuote();
              }}
              placeholder="Paste faucet account ID"
              className="font-mono text-[13px]"
            />
          </div>
        </div>

        {pendingQuote && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-neutral-900">
                Quote
              </span>
              <button
                type="button"
                className="text-xs text-neutral-500 underline"
                onClick={onClearQuote}
              >
                Clear quote
              </button>
            </div>
            <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-orange-700">
                Required deposit
              </p>
              <p className="mt-1 font-mono text-xl font-semibold text-orange-900">
                {formatQuoteTokenIn(
                  pendingQuote.quoteResult.tokenIn,
                  evmDisplayDecimals,
                ) || "calculated at execution"}{" "}
                {pendingQuote.quoteResult.tokenInSymbol ??
                  selectedToken?.symbol ??
                  "tokens"}
              </p>
            </div>
            <p className="text-xs text-neutral-500 italic">
              Keep at least this amount in your EVM wallet before confirming.
            </p>
          </div>
        )}

        {!pendingQuote ? (
          <Button
            type="button"
            className="w-full"
            size="lg"
            onClick={handleGetQuote}
            disabled={isFetchingQuote || !canQuote}
          >
            {isFetchingQuote ? "Fetching quote…" : "Get quote"}
          </Button>
        ) : (
          <Button
            type="button"
            className="w-full"
            size="lg"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Processing…" : "Confirm & sign"}
          </Button>
        )}

        {!isSDKReady && (
          <p className="text-xs text-amber-800">
            Epoch SDK not ready — connect your EVM wallet above.
          </p>
        )}

        {status && (
          <p
            className={`text-sm ${status.startsWith("Error") ? "text-red-600" : "text-amber-800"}`}
          >
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
