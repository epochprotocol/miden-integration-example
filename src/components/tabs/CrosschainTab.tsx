import { useMemo } from 'react';
import { useAccounts } from '@miden-sdk/react';
import { EVMWalletConnect } from '../crosschain/EVMWalletConnect';
import { IntentForm } from '../crosschain/IntentForm';
import { IntentStatus } from '../crosschain/IntentStatus';
import { useEpochIntent } from '../../hooks/useEpochIntent';
import { useIntentStatus } from '../../hooks/useIntentStatus';
import { loadFaucets, loadWallets } from '../../utils/persistence';
import type { MidenAccount, MidenFaucetInfo } from '../../types/miden';

interface Props {
  blockNum: number | null;
}

export function CrosschainTab({ blockNum }: Props) {
  const { wallets: walletHeaders, faucets: faucetHeaders } = useAccounts();

  const displayWallets: MidenAccount[] = useMemo(() => {
    const persisted = loadWallets();
    const localById = new Map(persisted.map((w) => [w.id.toLowerCase(), w]));
    return walletHeaders.map((h, i) => {
      const id = h.id().toString();
      return localById.get(id.toLowerCase()) ?? { id, label: `Wallet ${i + 1}`, type: 'wallet' as const };
    });
  }, [walletHeaders]);

  const displayFaucets: MidenFaucetInfo[] = useMemo(() => {
    const persisted = loadFaucets();
    const localById = new Map(persisted.map((f) => [f.id.toLowerCase(), f]));
    return faucetHeaders.map((h, i) => {
      const id = h.id().toString();
      return (
        localById.get(id.toLowerCase()) ?? {
          id,
          label: `Faucet ${i + 1}`,
          type: 'faucet' as const,
          symbol: '—',
          decimals: 8,
          maxSupply: '0',
        }
      );
    });
  }, [faucetHeaders]);

  const epoch = useEpochIntent();
  const intentNonce = epoch.intentResult?.intentNonce;
  const evmAddress = epoch.intentResult?.intentData?.recipient as string | undefined;
  const intentStatus = useIntentStatus(evmAddress, intentNonce);

  return (
    <div className="ui-tab-panel space-y-6">
      <header className="space-y-2">
        <h2 className="text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl">Bridge to EVM</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-neutral-600">
          Connect an Ethereum wallet, pick your Miden wallet and token, then submit your intent. The app may ask you
          to create a P2ID note when the allocator needs a lock.
        </p>
      </header>
      <EVMWalletConnect />
      <IntentForm
        accounts={displayWallets}
        faucets={displayFaucets}
        onCreateIntent={epoch.createIntent}
        currentBlockHeight={blockNum ?? undefined}
        isCreateIntentBusy={epoch.isLoading}
        isSDKReady={epoch.isSDKReady}
      />
      <IntentStatus
        result={epoch.intentResult}
        error={epoch.error}
        flowStatus={intentStatus.status}
        isPolling={intentStatus.isPolling}
      />
    </div>
  );
}
