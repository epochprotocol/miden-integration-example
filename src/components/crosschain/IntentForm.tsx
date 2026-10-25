import { useEffect, useRef, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { toast } from "sonner";
import type { SolveIntentParams } from "@epoch-protocol/epoch-intents-sdk";
import type {
  CrossChainIntentParams,
  MidenAssetOption,
} from "../../types/miden";
import type { IntentQuotePhase } from "../../hooks/useEpochIntent";
import {
  DEFAULT_EVM_CHAIN_ID_STR,
  isSupportedEvmChain,
} from "../../constants/chains";
import {
  getMidenFaucetDecimals,
  isPragmaSupportedMidenAsset,
} from "../../constants/miden-tokens";
import { EPOCH_EVM_TOKENS } from "../../constants/evm-tokens";
import { midenscanNoteUrl } from "../../lib/explorers";
import {
  extractIntentIdentity,
  readIntentError,
} from "../../lib/intent-result";
import { useIntentSettlementView } from "../../hooks/useIntentSettlementView";
import { useMidenP2IDNoteFactory } from "../../hooks/useMidenP2IDNoteFactory";
import type { CachedMidenNote } from "../../lib/miden-note-retry";
import { useMidenNetwork } from "../../hooks/useMidenNetwork";
import { getMidenPublicAccountError } from "../../lib/miden-account-validation";
import { Button } from "@/components/ui/button";
import { IntentSourceAssetField } from "./intent/IntentSourceAssetField";
import {
  IntentDestinationFields,
  type IntentDestination,
} from "./intent/IntentDestinationFields";
import { IntentQuoteSummary } from "./intent/IntentQuoteSummary";
import { SettlementPendingCard } from "./intent/SettlementPendingCard";
import { ExplorerHashCard } from "./intent/ExplorerHashCard";

interface Props {
  midenAccountId: string | null;
  midenAssets: MidenAssetOption[];
  isLoadingMidenAssets: boolean;
  onFetchQuote: (params: CrossChainIntentParams) => Promise<void>;
  onConfirmIntent: (input: {
    createMidenP2IDENote: SolveIntentParams["createMidenP2IDENote"];
    currentMidenAccountId: string;
  }) => Promise<unknown>;
  onClearQuote: () => void;
  quotePhase: IntentQuotePhase;
  isSDKReady: boolean;
  intentNonce?: string;
  intentUserAddress?: string;
}

export function IntentForm({
  midenAccountId,
  midenAssets,
  isLoadingMidenAssets,
  onFetchQuote,
  onConfirmIntent,
  onClearQuote,
  quotePhase,
  isSDKReady,
  intentNonce,
  intentUserAddress,
}: Props) {
  const { network } = useMidenNetwork();
  const { address } = useAccount();
  const walletChainId = useChainId();

  const supportedMidenAssets = midenAssets.filter((asset) =>
    isPragmaSupportedMidenAsset(asset, network),
  );
  const unsupportedAssetCount =
    midenAssets.length - supportedMidenAssets.length;
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const selectedAssetIdIsAvailable = supportedMidenAssets.some(
    (asset) => asset.assetId === selectedAssetId,
  );
  const resolvedSelectedAssetId = selectedAssetIdIsAvailable
    ? selectedAssetId
    : (supportedMidenAssets[0]?.assetId ?? "");

  // Follows the connected wallet until the user overrides a field. Not
  // useState defaults: the wallet connects after this mounts.
  const [edits, setEdits] = useState<Partial<IntentDestination>>({});
  const destination: IntentDestination = {
    outputToken: edits.outputToken ?? EPOCH_EVM_TOKENS[0].address,
    minTokenOut: edits.minTokenOut ?? "1000000",
    chainId:
      edits.chainId ??
      (isSupportedEvmChain(walletChainId)
        ? String(walletChainId)
        : DEFAULT_EVM_CHAIN_ID_STR),
    evmAddress: edits.evmAddress ?? address ?? "",
  };
  const [confirmStatus, setConfirmStatus] = useState("");
  const [localIntentNonce, setLocalIntentNonce] = useState<string | undefined>(
    undefined,
  );
  const [localIntentUserAddress, setLocalIntentUserAddress] = useState<
    string | undefined
  >(undefined);
  const [localMidenNote, setLocalMidenNote] = useState<
    CachedMidenNote | undefined
  >(undefined);
  const previousMidenAccountId = useRef(midenAccountId);

  useEffect(() => {
    if (previousMidenAccountId.current !== midenAccountId) {
      setLocalMidenNote(undefined);
      onClearQuote();
      previousMidenAccountId.current = midenAccountId;
    }
  }, [midenAccountId, onClearQuote]);

  const clearQuote = () => {
    setLocalMidenNote(undefined);
    onClearQuote();
  };

  const editDestination = (key: keyof IntentDestination, value: string) => {
    setEdits((prev) => ({ ...prev, [key]: value }));
    clearQuote();
  };

  const destinationChainIdNum = Number.parseInt(destination.chainId, 10);
  const hasValidDestinationChainId =
    Number.isInteger(destinationChainIdNum) && destinationChainIdNum > 0;
  const hasValidEvmRecipient = /^0x[a-fA-F0-9]{40}$/.test(
    destination.evmAddress.trim(),
  );

  const midenAccountError = midenAccountId
    ? getMidenPublicAccountError(midenAccountId, "Miden source account")
    : "Connect Miden wallet first";

  const selectedAsset = supportedMidenAssets.find(
    (a) => a.assetId.toLowerCase() === resolvedSelectedAssetId.toLowerCase(),
  );
  // Use the hardcoded faucet→decimals map only for display formatting. Do not
  // fall back to the wallet adapter's reported decimals (often defaults to 8
  // and silently mis-scales).
  const midenFaucetDecimals = resolvedSelectedAssetId
    ? getMidenFaucetDecimals(resolvedSelectedAssetId, network)
    : undefined;

  const settlement = useIntentSettlementView(
    localIntentUserAddress ?? intentUserAddress,
    localIntentNonce ?? intentNonce,
    hasValidDestinationChainId ? destinationChainIdNum : undefined,
  );

  const createMidenP2IDENote = useMidenP2IDNoteFactory({
    midenAccountId,
    existingNote: localMidenNote,
    onStatus: setConfirmStatus,
    onNoteCreated: setLocalMidenNote,
  });

  const buildParams = (): CrossChainIntentParams => {
    if (!destination.evmAddress) {
      throw new Error("Connect EVM wallet first");
    }
    if (!hasValidDestinationChainId) {
      throw new Error("Destination chain ID must be a positive integer.");
    }
    if (!hasValidEvmRecipient) {
      throw new Error(
        "Destination EVM address must be a valid 0x-prefixed 20-byte hex address.",
      );
    }
    if (!midenAccountId) {
      throw new Error("Connect Miden wallet first");
    }
    if (midenAccountError) {
      throw new Error(midenAccountError);
    }
    return {
      midenAccountId,
      midenFaucetId: resolvedSelectedAssetId,
      evmRecipient: destination.evmAddress.trim(),
      destinationChainId: destinationChainIdNum,
      outputTokenAddress: destination.outputToken,
      minTokenOut: destination.minTokenOut,
    };
  };

  const canFetch =
    isSDKReady &&
    !!midenAccountId &&
    !midenAccountError &&
    !!resolvedSelectedAssetId &&
    hasValidEvmRecipient &&
    !!destination.outputToken &&
    hasValidDestinationChainId;

  const handleGetQuote = () => {
    if (
      !destination.outputToken ||
      destination.outputToken === "0x0000000000000000000000000000000000000000"
    ) {
      toast.error("Select or enter a valid output token address");
      return;
    }
    void toast.promise(onFetchQuote(buildParams()), {
      loading: "Fetching quote…",
      success: "Quote ready — review and confirm",
      error: (err) => (err instanceof Error ? err.message : "Quote failed"),
    });
  };

  const handleConfirm = () => {
    if (quotePhase.status !== "ready") return;
    if (!midenAccountId || midenAccountError) {
      setConfirmStatus(`Error: ${midenAccountError}`);
      return;
    }

    void toast.promise(
      (async () => {
        setConfirmStatus("Submitting intent…");
        const result = await onConfirmIntent({
          createMidenP2IDENote,
          currentMidenAccountId: midenAccountId,
        });

        const solverError = readIntentError(result);
        if (solverError) throw new Error(solverError);

        const { nonce, recipient } = extractIntentIdentity(result);
        if (nonce) setLocalIntentNonce(nonce);
        // Prefer intentData.recipient, but fall back to what the user entered.
        setLocalIntentUserAddress(
          (recipient ?? destination.evmAddress).trim() || undefined,
        );

        setConfirmStatus("Intent submitted successfully.");
        return "Cross-chain intent submitted";
      })(),
      {
        loading: "Confirming intent…",
        success: (msg) => msg,
        error: (err) => {
          const msg = err instanceof Error ? err.message : "Unknown error";
          setConfirmStatus(`Error: ${msg}. Quote is still saved — try again.`);
          return `Error: ${msg}`;
        },
      },
    );
  };

  const activeQuote =
    quotePhase.status === "ready" || quotePhase.status === "confirming"
      ? quotePhase.quote
      : null;
  const isFetching = quotePhase.status === "fetching";
  const isConfirming = quotePhase.status === "confirming";

  return (
    <div className="ui-card">
      <h2 className="text-base font-semibold text-neutral-900">
        Intent details
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">
        Pick a Miden token and the EVM output you want to receive. Set a minimum
        output amount, then click <strong>Get quote</strong> to see the
        estimated Miden spend, and <strong>Confirm &amp; sign</strong> to lock
        funds and submit.
      </p>

      <div className="mt-4 space-y-4">
        <IntentSourceAssetField
          assets={supportedMidenAssets}
          selectedAssetId={resolvedSelectedAssetId}
          selectedAsset={selectedAsset}
          isLoadingAssets={isLoadingMidenAssets}
          unsupportedAssetCount={unsupportedAssetCount}
          onSelect={(assetId) => {
            setSelectedAssetId(assetId);
            clearQuote();
          }}
        />

        {midenAccountError && (
          <p className="text-xs text-red-600" role="alert">
            {midenAccountError}
          </p>
        )}

        <IntentDestinationFields
          values={destination}
          onChange={editDestination}
        />

        {activeQuote && (
          <IntentQuoteSummary
            quote={activeQuote}
            faucetDecimals={midenFaucetDecimals}
            assetSymbol={selectedAsset?.symbol}
            onRequote={clearQuote}
          />
        )}

        {activeQuote ? (
          <Button
            type="button"
            className="w-full"
            size="lg"
            onClick={handleConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? "Processing…" : "Confirm & Sign"}
          </Button>
        ) : (
          <Button
            type="button"
            className="w-full"
            size="lg"
            onClick={handleGetQuote}
            disabled={isFetching || !canFetch}
          >
            {isFetching ? "Fetching quote…" : "Get quote"}
          </Button>
        )}

        {!isSDKReady && (
          <p className="text-xs text-amber-800">
            Epoch SDK not ready — connect your EVM wallet above.
          </p>
        )}

        {confirmStatus && (
          <p
            className={`text-sm ${confirmStatus.startsWith("Error") ? "text-red-600" : "text-amber-800"}`}
          >
            {confirmStatus}
          </p>
        )}

        {localMidenNote && (
          <ExplorerHashCard
            label="Miden note id (P2IDE)"
            value={localMidenNote.noteId}
            href={midenscanNoteUrl(localMidenNote.noteId)}
            linkLabel="View on Midenscan"
            tone="neutral"
          />
        )}

        {settlement.showPollingSpinner && (
          <SettlementPendingCard statusLabel={settlement.latestStatusLabel} />
        )}

        {!!settlement.evmTransactionHash && (
          <ExplorerHashCard
            label="EVM execution tx hash"
            value={settlement.evmTransactionHash}
            href={settlement.explorerLink}
            linkLabel="View on explorer"
            tone="emerald"
          />
        )}
      </div>
    </div>
  );
}
