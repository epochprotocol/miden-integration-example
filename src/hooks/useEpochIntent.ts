import { useCallback, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import {
  buildCrossChainIntent,
  getCrossChainQuote,
  type CrossChainQuote,
} from "../services/epoch-bridge";
import type { CrossChainIntentParams, IntentResult } from "../types/miden";
import {
  CollateralType,
  MIDEN_VIRTUAL_CHAIN_ID,
  type SolveIntentParams,
} from "@epoch-protocol/epoch-intents-sdk";
import { useEpochSdk } from "../lib/epoch-sdk";
import { readIntentError } from "../lib/intent-result";

export type IntentQuotePhase =
  | { status: "idle" }
  | { status: "fetching" }
  | { status: "ready"; quote: CrossChainQuote }
  | { status: "confirming"; quote: CrossChainQuote };

export function useEpochIntent() {
  const [intentResult, setIntentResult] = useState<IntentResult | null>(null);
  const [pendingQuote, setPendingQuote] = useState<CrossChainQuote | null>(
    null,
  );
  const [isFetchingQuote, setIsFetchingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const sdk = useEpochSdk(MIDEN_VIRTUAL_CHAIN_ID);
  const { address } = useAccount();
  const queryClient = useQueryClient();

  /** Step 1: fetch a reverse quote (tokenInAmount=0 → backend computes required Miden input). */
  const fetchQuote = useCallback(
    async (params: CrossChainIntentParams) => {
      if (!sdk)
        throw new Error("Epoch SDK not ready — connect EVM wallet first");
      if (!address) throw new Error("Connect EVM wallet first");
      setIsFetchingQuote(true);
      setQuoteError(null);
      setPendingQuote(null);
      try {
        setPendingQuote(await getCrossChainQuote(sdk, params, address));
      } catch (err) {
        setQuoteError(err instanceof Error ? err.message : "Quote failed");
        throw err;
      } finally {
        setIsFetchingQuote(false);
      }
    },
    [sdk, address],
  );

  const {
    mutateAsync: confirmIntent,
    reset: resetConfirm,
    isPending: isConfirming,
    error: confirmError,
  } = useMutation({
    mutationFn: async (
      createMidenP2IDENote: SolveIntentParams["createMidenP2IDENote"],
    ) => {
      if (!sdk) throw new Error("Epoch SDK not ready");
      if (!pendingQuote) throw new Error("Fetch a quote first");

      setIntentResult(null);
      const result = await buildCrossChainIntent(sdk, {
        ...pendingQuote.params,
        collateralType: CollateralType.Miden,
        midenSourceAccount: pendingQuote.params.midenAccountId,
        createMidenP2IDENote,
        preFetchedQuote: pendingQuote,
      });
      // Set before throwing: an in-band failure still has a result worth showing.
      setIntentResult(result);
      const solverError = readIntentError(result);
      if (solverError) throw new Error(solverError);

      setPendingQuote(null);
      return result;
    },
    // Not onSuccess: a minted note means funds moved even if the intent failed.
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["midenAssets"] });
    },
  });

  const clearQuote = useCallback(() => {
    setPendingQuote(null);
    setQuoteError(null);
    resetConfirm();
  }, [resetConfirm]);

  const quotePhase = useMemo<IntentQuotePhase>(() => {
    if (isFetchingQuote) return { status: "fetching" };
    if (!pendingQuote) return { status: "idle" };
    return isConfirming
      ? { status: "confirming", quote: pendingQuote }
      : { status: "ready", quote: pendingQuote };
  }, [isFetchingQuote, isConfirming, pendingQuote]);

  return {
    fetchQuote,
    confirmIntent,
    clearQuote,
    quotePhase,
    intentResult,
    error: quoteError ?? confirmError?.message ?? null,
    isSDKReady: !!sdk,
  };
}
