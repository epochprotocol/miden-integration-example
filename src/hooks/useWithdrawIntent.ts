import { useCallback, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount, useWalletClient } from "wagmi";
import {
  buildEVMToMidenIntent,
  getEVMToMidenQuote,
  type EVMToMidenQuote,
} from "../services/epoch-bridge";
import type { EVMToMidenIntentParams, IntentResult } from "../types/miden";
import { useEpochSdk } from "../lib/epoch-sdk";
import { extractIntentIdentity } from "../lib/intent-result";

/** Mirrors useEpochIntent: quoting is a read (useState), confirming is a mutation. */
export function useWithdrawIntent() {
  const [withdrawResult, setWithdrawResult] = useState<IntentResult | null>(
    null,
  );
  const [pendingQuote, setPendingQuote] = useState<EVMToMidenQuote | null>(
    null,
  );
  const [isFetchingQuote, setIsFetchingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const sdk = useEpochSdk();
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();
  const queryClient = useQueryClient();

  // Read at render — inside the callback a stale client stamped the old chain.
  const depositChainId = walletClient?.chain?.id;

  const fetchQuote = useCallback(
    async (params: EVMToMidenIntentParams) => {
      if (!sdk)
        throw new Error("Epoch SDK not ready — connect your EVM wallet");
      if (!address) throw new Error("Connect EVM wallet first");
      setIsFetchingQuote(true);
      setQuoteError(null);
      setPendingQuote(null);
      try {
        const quote = await getEVMToMidenQuote(sdk, params, address);
        if (!quote.quoteResult.tokenIn || quote.quoteResult.tokenIn === "0") {
          throw new Error(
            "Quote returned no EVM input amount — try different minTokenOut or token pair",
          );
        }
        setPendingQuote(quote);
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
    mutateAsync: confirmWithdraw,
    reset: resetConfirm,
    isPending: isLoading,
    error: confirmError,
  } = useMutation({
    mutationFn: async () => {
      if (!sdk) throw new Error("Epoch SDK not ready");
      if (!address) throw new Error("Connect EVM wallet first");
      if (!pendingQuote) throw new Error("Fetch a quote first");

      setWithdrawResult(null);
      const result = await buildEVMToMidenIntent(sdk, {
        ...pendingQuote.params,
        evmSourceAddress: address,
        preFetchedQuote: pendingQuote,
      });

      const { nonce } = extractIntentIdentity(result);
      const resultWithNonce: IntentResult = {
        ...result,
        ...(nonce ? { intentNonce: nonce } : {}),
        ...(depositChainId != null ? { depositChainId } : {}),
      };
      setWithdrawResult(resultWithNonce);
      setPendingQuote(null);
      return resultWithNonce;
    },
    // Best-effort — the Miden credit actually lands later, via the status poll.
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["midenAssets"] });
    },
  });

  const clearQuote = useCallback(() => {
    setPendingQuote(null);
    setQuoteError(null);
    resetConfirm();
  }, [resetConfirm]);

  return {
    fetchQuote,
    confirmWithdraw,
    clearQuote,
    pendingQuote,
    withdrawResult,
    isLoading,
    isFetchingQuote,
    error: quoteError ?? confirmError?.message ?? null,
    address,
    isSDKReady: !!sdk,
  };
}
