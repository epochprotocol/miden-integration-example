import { useCallback, useEffect, useRef, useState } from "react";
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
import type {
  CompactRequest,
  ResourceLockStatus,
} from "@epoch-protocol/epoch-intents-sdk";

const PENDING_ALLOCATION_KEY = "epoch:miden:pending-allocation:v1";

type PendingAllocation = {
  request: CompactRequest;
  depositHash: string;
};

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
  const [resourceLockStatus, setResourceLockStatus] =
    useState<ResourceLockStatus | null>(null);
  const pendingRequestRef = useRef<CompactRequest | null>(null);

  const sdk = useEpochSdk();
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();
  const queryClient = useQueryClient();

  // Read at render — inside the callback a stale client stamped the old chain.
  const depositChainId = walletClient?.chain?.id;

  // A reload after the wallet confirms must only retry the idempotent allocator
  // submission. It must never reconstruct or re-send the on-chain deposit.
  useEffect(() => {
    if (!sdk || typeof window === "undefined") return;
    const raw = window.localStorage.getItem(PENDING_ALLOCATION_KEY);
    if (!raw) return;
    let pending: PendingAllocation;
    try {
      pending = JSON.parse(raw) as PendingAllocation;
    } catch {
      window.localStorage.removeItem(PENDING_ALLOCATION_KEY);
      return;
    }
    setResourceLockStatus({
      phase: "deposit-confirmed",
      chainId: Number(pending.request.chainId),
      claimHash: "0x" as `0x${string}`,
      transactionHash: pending.depositHash as `0x${string}`,
    });
    void sdk
      .submitAllocation(pending.request)
      .then(() => {
        setResourceLockStatus((current) =>
          current ? { ...current, phase: "allocation-accepted" } : current,
        );
        window.localStorage.removeItem(PENDING_ALLOCATION_KEY);
      })
      .catch(() => {
        // Keep the record: a later reload or explicit retry can safely resend
        // this exact request without asking the wallet to sign again.
      });
  }, [sdk]);

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
      setResourceLockStatus(null);
      const result = await buildEVMToMidenIntent(sdk, {
        ...pendingQuote.params,
        evmSourceAddress: address,
        preFetchedQuote: pendingQuote,
        onResourceLockStatus: (next) => {
          if (next.compactRequest)
            pendingRequestRef.current = next.compactRequest;
          setResourceLockStatus(next);
          if (
            next.phase === "deposit-confirmed" &&
            next.transactionHash &&
            pendingRequestRef.current &&
            typeof window !== "undefined"
          ) {
            window.localStorage.setItem(
              PENDING_ALLOCATION_KEY,
              JSON.stringify({
                request: pendingRequestRef.current,
                depositHash: next.transactionHash,
              } satisfies PendingAllocation),
            );
          }
          if (
            next.phase === "allocation-accepted" &&
            typeof window !== "undefined"
          ) {
            window.localStorage.removeItem(PENDING_ALLOCATION_KEY);
          }
        },
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
    resourceLockStatus,
    address,
    isSDKReady: !!sdk,
  };
}
