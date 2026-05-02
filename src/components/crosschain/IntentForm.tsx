import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectContent, SelectItem, SelectRoot, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAccounts, useConsume, useNotes, useSend, useSyncState } from '@miden-sdk/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { CrossChainIntentParams, MidenAccount, MidenFaucetInfo } from '../../types/miden';

const SEPOLIA_TOKENS = [
  { symbol: 'USDC', address: '0x2BB4FfD7E2c6D432b697554Efd77fA13bdbefd69' },
  { symbol: 'DAI', address: '0xc30f1Ce05d1434d484E9A47283aA925fc8A8699a' },
  { symbol: 'USDT', address: '0xc04d2869665Be874881133943523723Be5782720' },
  { symbol: 'WETH', address: '0x7946dd86eE310D0aC16804A37787289Fa5b88A8A' },
  { symbol: 'WBTC', address: '0x9b2a2754a9182fD65360E23afCDf3BeFF51796E9' },
  { symbol: 'PENGU', address: '0xEA7dC9849206Ce73b11c465d37b85eC06B11Cf2C' },
  { symbol: 'OSWALD', address: '0xB588418c0f90F07Bc9587d0050845a90C23C7502' },
  { symbol: 'KICK', address: '0x512Ee6Bd7A4be5Ba4796F15Df080c4D0F89a38eD' },
  { symbol: 'FERB', address: '0x145e03A80c19ad1b9d0429d06b6d52707de724A0' },
  { symbol: 'Custom', address: '' },
];

const TOKEN_CUSTOM = '__custom__';
const FAUCET_CUSTOM = '__custom_faucet__';

function waitTwoAnimationFrames(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

interface Props {
  accounts: MidenAccount[];
  faucets: MidenFaucetInfo[];
  onCreateIntent: (params: CrossChainIntentParams) => Promise<unknown>;
  currentBlockHeight?: number;
  isCreateIntentBusy: boolean;
  isSDKReady: boolean;
}

export function IntentForm({
  accounts,
  faucets,
  onCreateIntent,
  currentBlockHeight,
  isCreateIntentBusy,
  isSDKReady,
}: Props) {
  const [midenAccountId, setMidenAccountId] = useState('');
  const [faucetId, setFaucetId] = useState('');
  const [customFaucetId, setCustomFaucetId] = useState('');
  const [amount, setAmount] = useState('100');
  const [outputToken, setOutputToken] = useState(SEPOLIA_TOKENS[0].address);
  const [customToken, setCustomToken] = useState('');
  const [minTokenOut, setMinTokenOut] = useState('10');
  const [chainId, setChainId] = useState('11155111');
  const [status, setStatus] = useState('');
  const [evmAddress, setEvmAddress] = useState('0x4235215114484bACDfF0071dB54Dc9faaD3489a9');
  const [recallBlocks, setRecallBlocks] = useState('100');
  const [reclaimStatus, setReclaimStatus] = useState('');

  const { sync } = useSyncState();
  const { refetch: refetchAccounts } = useAccounts();
  const { send, isLoading: isSending } = useSend();
  const { consume, isLoading: isConsuming } = useConsume();
  const reclaimNotesFilter = useMemo(
    () => (midenAccountId ? ({ status: 'committed' as const, accountId: midenAccountId } as const) : undefined),
    [midenAccountId],
  );
  const { consumableNotes, refetch: refetchReclaimNotes, isLoading: reclaimNotesLoading } = useNotes(reclaimNotesFilter);
  const latestReclaimConsumable = useRef(consumableNotes);
  useEffect(() => {
    latestReclaimConsumable.current = consumableNotes;
  }, [consumableNotes]);
  const reclaimBusy = isConsuming || reclaimNotesLoading;

  const faucetSelectValue = faucetId === '' ? FAUCET_CUSTOM : faucetId;
  const resolvedFaucetId = customFaucetId || faucetId;
  const outputSelectValue = outputToken === '' ? TOKEN_CUSTOM : outputToken;

  const handleReclaim = () => {
    if (!midenAccountId) return;
    setReclaimStatus('');
    void toast.promise(
      (async () => {
        await sync();
        await refetchReclaimNotes();
        await waitTwoAnimationFrames();
        const notes = latestReclaimConsumable.current;
        if (!notes.length) {
          const msg = 'No reclaimable notes found.';
          setReclaimStatus(msg);
          return msg;
        }
        const reclaimConsumeOut = await consume({
          accountId: midenAccountId,
          notes: notes.map((n) => n.inputNoteRecord()),
        });
        console.log('[Miden] reclaim consume transactionId:', reclaimConsumeOut.transactionId);
        await sync();
        await refetchAccounts();
        await refetchReclaimNotes();
        const msg = 'Notes reclaimed successfully.';
        setReclaimStatus(msg);
        return msg;
      })(),
      {
        loading: 'Syncing and checking for reclaimable notes…',
        success: (msg) => msg,
        error: (err) => {
          const msg = `Reclaim failed: ${err instanceof Error ? err.message : 'Unknown error'}`;
          setReclaimStatus(msg);
          return msg;
        },
      },
    );
  };

  const handleSubmit = () => {
    if (!midenAccountId || !resolvedFaucetId || !amount || !evmAddress) return;

    const finalOutputToken = customToken || outputToken;
    if (!finalOutputToken || finalOutputToken === '0x0000000000000000000000000000000000000000') {
      setStatus('Error: Please select or enter a valid output token address');
      toast.error('Select or enter a valid output token address');
      return;
    }

    void toast.promise(
      (async () => {
        setStatus('Checking if deposit needed…');

        const recallOffset = parseInt(recallBlocks, 10) || 100;
        const recallHeight = currentBlockHeight ? currentBlockHeight + recallOffset : undefined;

        const selectedFaucet = faucets.find((f) => f.id === resolvedFaucetId);

        const params: CrossChainIntentParams = {
          midenAccountId,
          midenFaucetId: resolvedFaucetId,
          midenAmount: amount,
          midenDecimals: selectedFaucet?.decimals ?? 8,
          midenReclaimHeight: recallHeight,
          evmRecipient: evmAddress,
          destinationChainId: parseInt(chainId, 10),
          outputTokenAddress: finalOutputToken,
          minTokenOut,
        };

        const sdkParams = {
          ...params,
          collateralType: 'miden' as const,
          midenSourceAccount: midenAccountId,
          createMidenP2IDNote: async (faucetIdParam: string, amountParam: string, allocatorId: string) => {
            setStatus('Resource lock required — creating P2IDE note on Miden…');
            try {
              const out = await send({
                from: midenAccountId,
                to: allocatorId,
                assetId: faucetIdParam,
                amount: BigInt(amountParam),
                noteType: recallHeight != null ? 'public' : 'private',
                recallHeight: recallHeight ?? undefined,
              });

              let noteIdStr: string | null = null;
              if (out.note) {
                try {
                  noteIdStr = out.note.id().toString();
                } catch {
                  noteIdStr = null;
                }
              }
              console.log('[Miden] intent P2ID send txId:', out.txId, 'output note id:', noteIdStr);
              await sync();
              await refetchAccounts();

              return { success: true, noteId: noteIdStr ?? undefined };
            } catch (err) {
              const errorMsg = err instanceof Error ? err.message : String(err);
              return { success: false, error: errorMsg };
            }
          },
        };

        await onCreateIntent(sdkParams);
        setStatus('Intent submitted successfully.');
        return 'Cross-chain intent submitted';
      })(),
      {
        loading: 'Creating cross-chain intent…',
        success: (msg) => msg,
        error: (err) => {
          const msg = `Error: ${err instanceof Error ? err.message : 'Unknown error'}`;
          setStatus(msg);
          return msg;
        },
      },
    );
  };

  return (
    <div className="ui-card">
      <h2 className="text-base font-semibold text-neutral-900">Intent details</h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">
        Lock Miden tokens for the allocator, choose the EVM token and chain you want, then submit. The flow may open
        your Miden wallet to create a P2ID note when required.
      </p>

      <div className="mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Source (Miden wallet)</Label>
            <SelectRoot value={midenAccountId || undefined} onValueChange={setMidenAccountId}>
              <SelectTrigger aria-label="Select Miden wallet">
                <SelectValue placeholder="Select wallet" />
              </SelectTrigger>
              <SelectContent>
                {accounts
                  .filter((a) => a.type === 'wallet')
                  .map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.label} — {a.id.slice(0, 16)}…
                    </SelectItem>
                  ))}
              </SelectContent>
            </SelectRoot>
          </div>
          <div>
            <Label>Token (faucet)</Label>
            <SelectRoot
              value={faucetSelectValue}
              onValueChange={(v) => {
                if (v === FAUCET_CUSTOM) {
                  setFaucetId('');
                  setCustomFaucetId('');
                } else {
                  setFaucetId(v);
                  setCustomFaucetId('');
                }
              }}
            >
              <SelectTrigger aria-label="Select faucet">
                <SelectValue placeholder="Select faucet" />
              </SelectTrigger>
              <SelectContent>
                {faucets.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.symbol} — {f.id.slice(0, 16)}…
                  </SelectItem>
                ))}
                <SelectItem value={FAUCET_CUSTOM}>Custom faucet ID</SelectItem>
              </SelectContent>
            </SelectRoot>
          </div>
        </div>

        {faucetId === '' && (
          <div>
            <Label htmlFor="intent-custom-faucet">Custom faucet ID</Label>
            <Input
              id="intent-custom-faucet"
              value={customFaucetId}
              onChange={(e) => setCustomFaucetId(e.target.value)}
              placeholder="0x…"
              className="font-mono text-[13px]"
            />
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="intent-amount">Amount</Label>
            <Input id="intent-amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="intent-chain">Destination chain ID</Label>
            <Input id="intent-chain" value={chainId} onChange={(e) => setChainId(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="intent-recall">Recall after (blocks)</Label>
            <Input
              id="intent-recall"
              value={recallBlocks}
              onChange={(e) => setRecallBlocks(e.target.value)}
              title="Note becomes reclaimable after this many blocks (~10s/block)"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="intent-evm">Destination (EVM wallet)</Label>
          <Input
            id="intent-evm"
            value={evmAddress}
            onChange={(e) => setEvmAddress(e.target.value)}
            variant="dim"
            className="font-mono text-[13px]"
            placeholder="0x…"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>
              Output token ({chainId === '11155111' ? 'Sepolia' : 'destination chain'})
            </Label>
            <SelectRoot
              value={outputSelectValue}
              onValueChange={(v) => {
                if (v === TOKEN_CUSTOM) {
                  setOutputToken('');
                  setCustomToken('');
                } else {
                  setOutputToken(v);
                  setCustomToken('');
                }
              }}
            >
              <SelectTrigger aria-label="Select output token">
                <SelectValue placeholder="Token" />
              </SelectTrigger>
              <SelectContent>
                {SEPOLIA_TOKENS.map((token) => (
                  <SelectItem
                    key={token.symbol}
                    value={token.address === '' ? TOKEN_CUSTOM : token.address}
                  >
                    {token.symbol}
                    {token.address ? ` · ${token.address.slice(0, 10)}…` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          </div>
          <div>
            <Label htmlFor="intent-min-out">Min output amount</Label>
            <Input id="intent-min-out" value={minTokenOut} onChange={(e) => setMinTokenOut(e.target.value)} />
          </div>
        </div>

        {outputToken === '' && (
          <div>
            <Label htmlFor="intent-custom-token">Custom token address</Label>
            <Input
              id="intent-custom-token"
              value={customToken}
              onChange={(e) => setCustomToken(e.target.value)}
              placeholder="0x…"
              className="font-mono text-[13px]"
            />
          </div>
        )}

        <Button
          type="button"
          className="w-full"
          size="lg"
          onClick={handleSubmit}
          disabled={
            isCreateIntentBusy || isSending || !isSDKReady || !midenAccountId || !resolvedFaucetId || !evmAddress
          }
        >
          {isCreateIntentBusy || isSending ? 'Processing…' : 'Create cross-chain intent'}
        </Button>

        {!isSDKReady && (
          <p className="text-xs text-amber-800">
            Epoch SDK is not ready. Connect your EVM wallet above and wait for it to load — creating an intent
            requires the SDK.
          </p>
        )}

        {status && (
          <p className={`text-sm ${status.startsWith('Error') ? 'text-red-600' : 'text-amber-800'}`}>{status}</p>
        )}

        <div className="border-t border-neutral-200 pt-5">
          <h3 className="text-sm font-semibold text-neutral-800">Recover funds from expired bridge notes</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-neutral-600">
            Only after a time-locked P2ID note passes its recall height without the bridge finishing: run this against
            the same Miden wallet you used for the intent so locked funds can be released back on-chain.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleReclaim}
              disabled={reclaimBusy || !midenAccountId}
            >
              Reclaim expired notes
            </Button>
            {currentBlockHeight != null && (
              <span className="text-xs text-neutral-500">Current block: {currentBlockHeight}</span>
            )}
          </div>
          {reclaimStatus && (
            <p
              className={`mt-2 text-sm ${reclaimStatus.includes('failed') ? 'text-red-600' : 'text-neutral-700'}`}
            >
              {reclaimStatus}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
