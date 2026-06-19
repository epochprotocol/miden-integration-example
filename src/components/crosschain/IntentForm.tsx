import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectContent, SelectItem, SelectRoot, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMidenFiWallet } from '@miden-sdk/miden-wallet-adapter-react';
import { SendTransaction } from '@miden-sdk/miden-wallet-adapter-base';
import { useState } from 'react';
import { toast } from 'sonner';
import type { CrossChainIntentParams } from '../../types/miden';
import type { CrossChainQuote } from '../../services/epoch-bridge';
import { formatQuoteTokenIn } from '../../services/epoch-bridge';
import type { SolveIntentParams } from '@epoch-protocol/epoch-intents-sdk/dist/types';
import {
  DEFAULT_TESTNET_CHAIN_ID_STR,
  EPOCH_TESTNET_EVM_CHAINS,
  getTestnetChainName,
} from '../../constants/chains';
import { getMidenFaucetDecimals } from '../../constants/miden-tokens';
import { EPOCH_TESTNET_TOKENS } from '../../constants/evm-tokens';
import { explorerTxUrl } from '../../lib/explorers';
import { useAccount } from 'wagmi';
import { useIntentTransactionStatus } from '../../hooks/useIntentTransactionStatus';

const TESTNET_TOKENS = EPOCH_TESTNET_TOKENS;

interface Props {
  midenAccountId: string | null;
  midenAssets: Array<{
    assetId: string;
    amount: bigint;
    symbol?: string;
  }>;
  isLoadingMidenAssets: boolean;
  onFetchQuote: (params: CrossChainIntentParams) => Promise<void>;
  onConfirmIntent: (createMidenP2IDNote: SolveIntentParams['createMidenP2IDNote']) => Promise<unknown>;
  onClearQuote: () => void;
  pendingQuote: CrossChainQuote | null;
  isFetchingQuote: boolean;
  isConfirmBusy: boolean;
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
  pendingQuote,
  isFetchingQuote,
  isConfirmBusy,
  isSDKReady,
  intentNonce,
  intentUserAddress,
}: Props) {
  const { requestSend, waitForTransaction } = useMidenFiWallet();

  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [minTokenOut, setMinTokenOut] = useState('1000000000000000000');
  const [outputToken, setOutputToken] = useState(TESTNET_TOKENS[0].address);
  const [chainId, setChainId] = useState(DEFAULT_TESTNET_CHAIN_ID_STR);
  const [confirmStatus, setConfirmStatus] = useState('');
  const [localIntentNonce, setLocalIntentNonce] = useState<string | undefined>(undefined);
  const [localIntentUserAddress, setLocalIntentUserAddress] = useState<string | undefined>(undefined);
  const [localMidenNoteId, setLocalMidenNoteId] = useState<string | undefined>(undefined);
  const destinationChainIdNum = Number.parseInt(chainId, 10);
  const hasValidDestinationChainId = Number.isInteger(destinationChainIdNum) && destinationChainIdNum > 0;
  const { address } = useAccount();
  const [evmAddress, setEvmAddress] = useState(address ?? '');

  const effectiveIntentNonce = localIntentNonce ?? intentNonce;
  const effectiveIntentUserAddress = localIntentUserAddress ?? intentUserAddress;
  const { statuses: txStatuses, isPolling: isTxStatusPolling } = useIntentTransactionStatus(
    effectiveIntentUserAddress,
    effectiveIntentNonce,
    hasValidDestinationChainId ? destinationChainIdNum : undefined,
  );

  const latestStatus = txStatuses[txStatuses.length - 1];
  const latestStatusLabel = latestStatus?.status ? String(latestStatus.status) : undefined;

  // Strict display gate:
  //   1. Filter rows to destination chain only (ignore internal Compact-claim
  //      row on dispatcher chain, e.g. Base Sepolia 84532).
  //   2. If ANY destination-chain row is still pending, render NOTHING and
  //      keep the polling loader visible — SIO can list a prior-step success
  //      alongside the not-yet-settled user tx; the user's tx is the one
  //      currently pending.
  //   3. Once no pending rows remain on the destination chain, pick the LAST
  //      success row — that is the final user settlement.
  const destRows = txStatuses.filter((s) => Number(s.chainId) === destinationChainIdNum);
  const hasPendingDestRow = destRows.some(
    (s) => String(s.status).toLowerCase() === 'pending',
  );
  const destSuccessRows = destRows.filter(
    (s) =>
      String(s.status).toLowerCase() === 'success' &&
      typeof s.transactionHash === 'string' &&
      s.transactionHash.length > 0,
  );
  const evmCompletedStatus = hasPendingDestRow
    ? undefined
    : destSuccessRows[destSuccessRows.length - 1];
  const evmTransactionHash = evmCompletedStatus?.transactionHash;
  const evmTxChainId = evmCompletedStatus?.chainId ?? destinationChainIdNum;
  // Spinner shows while polling OR while any destination row is still pending,
  // even if polling already exited (defensive — keeps user from seeing a
  // half-rendered state if poll terminates between updates).
  const showPollingSpinner = (isTxStatusPolling || hasPendingDestRow) && !evmTransactionHash;

  const midenScanBase =
    (import.meta as any).env?.VITE_MIDENSCAN_URL || 'https://testnet.midenscan.com';
  const midenNoteUrl = localMidenNoteId
    ? `${midenScanBase}/note/${localMidenNoteId}`
    : undefined;

  const explorerLink = evmTransactionHash
    ? explorerTxUrl(Number(evmTxChainId), evmTransactionHash)
    : undefined;

  const hasValidEvmRecipient = /^0x[a-fA-F0-9]{40}$/.test(evmAddress?.trim() ?? '');

  const selectedAsset = midenAssets.find(
    (a) => a.assetId.toLowerCase() === selectedAssetId.toLowerCase(),
  );
  // Use the hardcoded faucet→decimals map. Do NOT fall back to the wallet
  // adapter's reported decimals (often defaults to 8 and silently mis-scales).
  // `undefined` here gates the form via `Number.isFinite` below.
  const midenFaucetDecimals = selectedAssetId
    ? getMidenFaucetDecimals(selectedAssetId)
    : undefined;

  const buildParams = (): CrossChainIntentParams => {
    if (!evmAddress) {
      throw new Error('Connect EVM wallet first');
    }
    if (!hasValidDestinationChainId) {
      throw new Error('Destination chain ID must be a positive integer.');
    }
    if (!hasValidEvmRecipient) {
      throw new Error('Destination EVM address must be a valid 0x-prefixed 20-byte hex address.');
    }
    if (!midenAccountId) {
      throw new Error('Connect Miden wallet first');
    }
    if (midenFaucetDecimals === undefined) {
      throw new Error(
        `Unknown Miden faucet ${selectedAssetId} — add it to miden-tokens.ts before sending.`,
      );
    }
    return {
      midenAccountId,
      midenFaucetId: selectedAssetId,
      evmRecipient: evmAddress.trim(),
      destinationChainId: destinationChainIdNum,
      outputTokenAddress: outputToken,
      minTokenOut,
    };
  };

  const canFetch =
    isSDKReady &&
    !!midenAccountId &&
    !!selectedAssetId &&
    hasValidEvmRecipient &&
    !!outputToken &&
    hasValidDestinationChainId &&
    Number.isFinite(midenFaucetDecimals);

  const handleGetQuote = () => {
    if (!outputToken || outputToken === '0x0000000000000000000000000000000000000000') {
      toast.error('Select or enter a valid output token address');
      return;
    }
    void toast.promise(onFetchQuote(buildParams()), {
      loading: 'Fetching quote…',
      success: 'Quote ready — review and confirm',
      error: (err) => (err instanceof Error ? err.message : 'Quote failed'),
    });
  };

  const handleConfirm = () => {
    if (!pendingQuote) return;

    const createMidenP2IDNote: SolveIntentParams['createMidenP2IDNote'] = async (
      faucetIdParam,
      amountParam,
      allocatorId,
    ) => {
      setConfirmStatus('Resource lock required — creating P2IDE note on Miden…');
      try {
        if (!midenAccountId) {
          throw new Error('Missing Miden account id');
        }
        if (!requestSend) {
          throw new Error('Miden wallet adapter not available');
        }

        const normalizedAmount = BigInt(amountParam);
        if (normalizedAmount > BigInt(Number.MAX_SAFE_INTEGER)) {
          throw new Error('Amount too large for wallet adapter send');
        }

        const payload = new SendTransaction(
          midenAccountId,
          allocatorId,
          faucetIdParam,
          'public',
          Number(normalizedAmount),
        );
        const txId = await requestSend(payload);

        // Prefer adapter waitForTransaction to get the output note id.
        if (!waitForTransaction) {
          throw new Error('waitForTransaction not available in adapter');
        }
        const finalized = await waitForTransaction(txId, 120_000);
        const first = finalized.outputNotes?.[0];
        const noteId = first ? first.id().toString() : '';
        if (!noteId) {
          throw new Error(`Could not read output note id for tx ${txId}`);
        }
        setLocalMidenNoteId(noteId);
        return { success: true, noteId };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : String(err) };
      }
    };

    void toast.promise(
      (async () => {
        setConfirmStatus('Submitting intent…');
        const result = await onConfirmIntent(createMidenP2IDNote);
        if (result && typeof result === 'object' && 'error' in result && (result as { error?: string }).error) {
          throw new Error((result as { error: string }).error);
        }
        if (result && typeof result === 'object') {
          const r = result as any;
          const isNonceLike = (v: unknown) =>
            typeof v === 'string' || typeof v === 'number' || typeof v === 'bigint';
          const rawNonce = isNonceLike(r.nonce)
            ? r.nonce
            : isNonceLike(r.intentNonce)
              ? r.intentNonce
              : isNonceLike(r.solveResult?.nonce)
                ? r.solveResult.nonce
                : isNonceLike(r.solveResult?.submittedIntentData?.nonce)
                  ? r.solveResult.submittedIntentData.nonce
                  : isNonceLike(r.submittedIntentData?.nonce)
                    ? r.submittedIntentData.nonce
                    : undefined;
          const nonce = rawNonce != null ? String(rawNonce) : undefined;
          const recipient =
            'intentData' in result &&
            (result as any).intentData &&
            typeof (result as any).intentData === 'object' &&
            typeof (result as any).intentData.recipient === 'string'
              ? ((result as any).intentData.recipient as string)
              : undefined;

          if (nonce) setLocalIntentNonce(nonce);
          // Prefer intentData.recipient, but fall back to what the user entered in the form.
          setLocalIntentUserAddress((recipient ?? evmAddress)?.trim() || undefined);
        }
        setConfirmStatus('Intent submitted successfully.');
        return 'Cross-chain intent submitted';
      })(),
      {
        loading: 'Confirming intent…',
        success: (msg) => msg,
        error: (err) => {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          setConfirmStatus(`Error: ${msg}. Quote is still saved — try again.`);
          return `Error: ${msg}`;
        },
      },
    );
  };

  return (
    <div className="ui-card">
      <h2 className="text-base font-semibold text-neutral-900">Intent details</h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">
        Pick a Miden token and the EVM output you want to receive. Set a minimum output amount, then click{' '}
        <strong>Get quote</strong> to see the estimated Miden spend, and <strong>Confirm &amp; sign</strong> to lock
        funds and submit.
      </p>

      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <Label>Source asset</Label>
          <SelectRoot
            value={selectedAssetId || undefined}
            onValueChange={(v) => {
              setSelectedAssetId(v);
              onClearQuote();
            }}
          >
            <SelectTrigger aria-label="Select Miden asset">
              <SelectValue placeholder={isLoadingMidenAssets ? 'Loading assets…' : 'Select asset'} />
            </SelectTrigger>
            <SelectContent>
              {(midenAssets ?? []).map((a) => (
                <SelectItem key={a.assetId} value={a.assetId}>
                  {(a.symbol ?? a.assetId.slice(0, 16) + '…')} — {a.amount.toString()}
                </SelectItem>
              ))}
            </SelectContent>
          </SelectRoot>
          <p className="text-xs text-neutral-500">
            Balance: <span className="font-mono">{selectedAsset?.amount?.toString() ?? '—'}</span>
          </p>
        </div>

        {/* Output */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Output token ({getTestnetChainName(chainId)})</Label>
            <SelectRoot
              value={outputToken}
              onValueChange={(v) => {
                setOutputToken(v);
                onClearQuote();
              }}
            >
              <SelectTrigger aria-label="Select output token">
                <SelectValue placeholder="Token" />
              </SelectTrigger>
              <SelectContent>
                {TESTNET_TOKENS.map((token) => (
                  <SelectItem key={token.symbol} value={token.address}>
                    {token.symbol}{token.address ? ` · ${token.address.slice(0, 10)}…` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          </div>
          <div>
            <Label htmlFor="intent-min-out">Min output amount</Label>
            <Input
              id="intent-min-out"
              value={minTokenOut}
              onChange={(e) => { setMinTokenOut(e.target.value); onClearQuote(); }}
              placeholder="e.g. 10"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Destination chain</Label>
            <SelectRoot
              value={chainId}
              onValueChange={(v) => {
                setChainId(v);
                onClearQuote();
              }}
            >
              <SelectTrigger aria-label="Select destination chain">
                <SelectValue placeholder="Chain" />
              </SelectTrigger>
              <SelectContent>
                {EPOCH_TESTNET_EVM_CHAINS.map((chain) => (
                  <SelectItem key={chain.id} value={String(chain.id)}>
                    {chain.name} ({chain.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          </div>
        </div>

        <div>
          <Label htmlFor="intent-evm">Destination (EVM wallet)</Label>
          <Input
            id="intent-evm"
            value={evmAddress ?? '' }
            onChange={(e) => {
              onClearQuote();
              setEvmAddress(e.target.value);
            }}
            variant="dim"
            className="font-mono text-[13px]"
            placeholder="0x…"
          />
        </div>

        {/* Quote summary — shown after successful fetchQuote */}
        {pendingQuote && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-neutral-900">Quote</span>
              <button
                type="button"
                className="text-xs text-neutral-500 underline"
                onClick={onClearQuote}
              >
                Re-quote
              </button>
            </div>
            <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-orange-700">Required deposit</p>
              <p className="mt-1 font-mono text-xl font-semibold text-orange-900">
                {(() => {
                  const tokenInRaw = (pendingQuote.quoteResult as any).tokenIn as
                    | string
                    | undefined;
                  if (!tokenInRaw) return 'calculated at execution';
                  if (midenFaucetDecimals === undefined) return tokenInRaw;
                  return `${formatQuoteTokenIn(
                    tokenInRaw,
                    midenFaucetDecimals,
                  )} ${selectedAsset?.symbol ?? 'tokens'}`;
                })()}
              </p>
            </div>
            <p className="text-xs text-neutral-500 italic">Keep at least this amount in your Miden wallet before confirming.</p>
          </div>
        )}

        {/* Action buttons */}
        {!pendingQuote ? (
          <Button
            type="button"
            className="w-full"
            size="lg"
            onClick={handleGetQuote}
            disabled={isFetchingQuote || !canFetch}
          >
            {isFetchingQuote ? 'Fetching quote…' : 'Get quote'}
          </Button>
        ) : (
          <Button
            type="button"
            className="w-full"
            size="lg"
            onClick={handleConfirm}
            disabled={isConfirmBusy}
          >
            {isConfirmBusy ? 'Processing…' : 'Confirm & Sign'}
          </Button>
        )}

        {!isSDKReady && (
          <p className="text-xs text-amber-800">
            Epoch SDK not ready — connect your EVM wallet above.
          </p>
        )}

        {confirmStatus && (
          <p className={`text-sm ${confirmStatus.startsWith('Error') ? 'text-red-600' : 'text-amber-800'}`}>
            {confirmStatus}
          </p>
        )}

        {localMidenNoteId && (
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] uppercase tracking-wide text-neutral-500">Miden note id (P2IDE)</div>
              {midenNoteUrl && (
                <a
                  href={midenNoteUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-[11px] font-medium text-neutral-600 underline hover:text-neutral-900"
                >
                  View on Midenscan ↗
                </a>
              )}
            </div>
            {midenNoteUrl ? (
              <a
                href={midenNoteUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-0.5 block font-mono text-[12px] text-neutral-700 break-all underline decoration-neutral-300 hover:decoration-neutral-700"
              >
                {localMidenNoteId}
              </a>
            ) : (
              <div className="mt-0.5 font-mono text-[12px] text-neutral-700 break-all">{localMidenNoteId}</div>
            )}
          </div>
        )}

        {showPollingSpinner && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
            <div className="flex items-center gap-3">
              <svg
                className="h-5 w-5 animate-spin text-amber-700"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              <div className="flex-1">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">
                  Waiting for EVM execution
                </div>
                <div className="mt-0.5 text-[12px] text-amber-900">
                  {latestStatusLabel
                    ? `Status: ${latestStatusLabel} · polling every 5s…`
                    : 'Solver picking up intent · polling every 5s…'}
                </div>
              </div>
            </div>
          </div>
        )}

        {!!evmTransactionHash && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
                EVM execution tx hash
              </div>
              {explorerLink && (
                <a
                  href={explorerLink}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-[11px] font-medium text-emerald-700 underline hover:text-emerald-900"
                >
                  View on explorer ↗
                </a>
              )}
            </div>
            {explorerLink ? (
              <a
                href={explorerLink}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-0.5 block font-mono text-[12px] text-emerald-900 break-all underline decoration-emerald-300 hover:decoration-emerald-700"
              >
                {evmTransactionHash}
              </a>
            ) : (
              <div className="mt-0.5 font-mono text-[12px] text-emerald-900 break-all">
                {evmTransactionHash}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
