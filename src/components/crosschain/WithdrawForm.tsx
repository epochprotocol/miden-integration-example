import { useState } from "react";
import type { MidenNoteVisibility } from "@epoch-protocol/epoch-intents-sdk";
import { useAccount, useChainId } from "wagmi";
import { toast } from "sonner";
import { MIDEN_VIRTUAL_CHAIN_ID } from "@epoch-protocol/epoch-intents-sdk";
import type { MidenAccount, EVMToMidenIntentParams } from "../../types/miden";
import type { EVMToMidenQuote } from "../../services/epoch-bridge";
import { truncateHash } from "../../lib/explorers";
import { readDepositHash, readIntentError } from "../../lib/intent-result";
import { findEvmToken } from "../../constants/evm-tokens";
import { Button } from "@/components/ui/button";
import {
  CUSTOM_TOKEN_DEFAULT_DECIMALS,
  WITHDRAW_TOKENS,
} from "./withdraw/withdraw-tokens";
import {
  WITHDRAW_DEPOSIT_TOAST_ID,
  WITHDRAW_SETTLE_TOAST_ID,
} from "./withdraw/withdraw-toasts";
import { WithdrawTokenFields } from "./withdraw/WithdrawTokenFields";
import { WithdrawNoteVisibilityField } from "./withdraw/WithdrawNoteVisibilityField";
import { WithdrawAccountFields } from "./withdraw/WithdrawAccountFields";
import { WithdrawQuoteSummary } from "./withdraw/WithdrawQuoteSummary";

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
  const [evmToken, setEvmToken] = useState(WITHDRAW_TOKENS[0].address);
  const [customToken, setCustomToken] = useState("");
  const [minTokenOut, setMinTokenOut] = useState("1000000");
  const [midenRecipientInput, setMidenRecipientInput] = useState("");
  const [midenFaucetId, setMidenFaucetId] = useState(
    "0xfc90f0f4da30e51168453b60eafed7",
  );
  const [status, setStatus] = useState("");
  const [noteVisibility, setNoteVisibility] =
    useState<MidenNoteVisibility>("public");

  const { address: connectedAddress } = useAccount();
  const walletChainId = useChainId();

  // Defaults to the connected wallet until the user types their own.
  const midenRecipientId = midenRecipientInput || (accounts[0]?.id ?? "");

  const resolvedFaucetId = midenFaucetId.trim();
  const finalToken = customToken || evmToken;
  // Resolve decimals via the canonical EVM token map first (case-insensitive
  // address match). Custom / unknown tokens fall back to 18 — the SIO testnet
  // default. Do NOT trust a stale entry from `WITHDRAW_TOKENS` matched by exact
  // string equality; the canonical lookup is normalized.
  const selectedToken = findEvmToken(finalToken);
  const evmTokenDecimals =
    selectedToken?.decimals ?? CUSTOM_TOKEN_DEFAULT_DECIMALS;

  const buildParams = (): EVMToMidenIntentParams => {
    if (!connectedAddress) {
      throw new Error("Connect EVM wallet first");
    }
    return {
      sourceChainId: walletChainId,
      destinationChainId: MIDEN_VIRTUAL_CHAIN_ID,
      evmSourceAddress: connectedAddress,
      evmTokenAddress: finalToken,
      evmTokenDecimals,
      midenRecipientId,
      midenFaucetId: resolvedFaucetId,
      minTokenOut: minTokenOut.trim(),
      midenNoteVisibility: noteVisibility,
    };
  };

  const canQuote =
    isSDKReady &&
    !!connectedAddress &&
    walletChainId > 0 &&
    !!midenRecipientId &&
    !!resolvedFaucetId &&
    !!finalToken &&
    minTokenOut.trim() !== "" &&
    minTokenOut.trim() !== "0";

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
      const solverError = readIntentError(result);
      if (solverError) throw new Error(solverError);

      const depositHash = readDepositHash(result);

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

  const handleSelectToken = (address: string) => {
    setEvmToken(address);
    setCustomToken("");
    onClearQuote();
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
        <WithdrawTokenFields
          walletChainId={walletChainId}
          evmToken={evmToken}
          customToken={customToken}
          minTokenOut={minTokenOut}
          onEvmTokenChange={handleSelectToken}
          onCustomTokenChange={(v) => {
            setCustomToken(v);
            onClearQuote();
          }}
          onMinTokenOutChange={(v) => {
            setMinTokenOut(v);
            onClearQuote();
          }}
        />

        <WithdrawNoteVisibilityField
          value={noteVisibility}
          onSelect={(v) => {
            setNoteVisibility(v);
            // The choice is part of the signed mandate, so a stale quote would
            // register a claim hash for the OTHER visibility.
            onClearQuote();
          }}
        />

        <WithdrawAccountFields
          connectedAddress={connectedAddress}
          midenRecipientId={midenRecipientId}
          midenFaucetId={midenFaucetId}
          onMidenRecipientIdChange={(v) => {
            setMidenRecipientInput(v);
            onClearQuote();
          }}
          onMidenFaucetIdChange={(v) => {
            setMidenFaucetId(v);
            onClearQuote();
          }}
        />

        {pendingQuote && (
          <WithdrawQuoteSummary
            quote={pendingQuote}
            displayDecimals={evmTokenDecimals}
            fallbackSymbol={selectedToken?.symbol}
            onClearQuote={onClearQuote}
          />
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
            onClick={() => void handleConfirm()}
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
