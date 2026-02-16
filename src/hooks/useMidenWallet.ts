import { useState, useCallback, useRef, useEffect } from 'react';
import type { MidenAccount, VaultAsset } from '../types/miden';
// import type { WebClient, Account, AccountId } from '../types/miden-sdk';
import { loadWallets, saveWallets } from '../utils/persistence';
import type { Account, AccountId, WebClient } from '@miden-sdk/miden-sdk';

interface UseMidenWalletReturn {
  accounts: MidenAccount[];
  balances: Record<string, VaultAsset[]>;
  createWallet: () => Promise<string | undefined>;
  syncState: () => Promise<void>;
  getAccountId: (idStr: string) => AccountId | string;
  accountObjectsRef: React.MutableRefObject<Map<string, Account>>;
  isLoading: boolean;
  error: string | null;
}

/**
 * React hook for managing Miden wallets and balances.
 *
 * IMPORTANT: Stores Account WASM objects in a ref to enable fresh .id() calls.
 * WASM AccountId objects can be freed/GC'd between async calls, so we always
 * call .id() fresh inline for each SDK method call.
 */
export function useMidenWallet(client: WebClient | null): UseMidenWalletReturn {
  const [accounts, setAccounts] = useState<MidenAccount[]>(() => loadWallets());
  const [balances, setBalances] = useState<Record<string, VaultAsset[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store actual Account WASM objects so we can call .id() fresh for each SDK call
  const accountObjectsRef = useRef<Map<string, Account>>(new Map());

  // Restore Account WASM objects from client when available
  useEffect(() => {
    if (!client || accounts.length === 0) return;

    const restoreAccounts = async () => {
      console.log('[Miden] Restoring', accounts.length, 'accounts from storage');
      const { AccountId } = await import('@miden-sdk/miden-sdk');

      for (const account of accounts) {
        try {
          // Skip if already loaded
          if (accountObjectsRef.current.has(account.id)) continue;

          const accountId = AccountId.fromHex(account.id);
          const accountObj = await client.getAccount(accountId);

          if (accountObj) {
            accountObjectsRef.current.set(account.id, accountObj);
            console.log('[Miden] Restored account:', account.id);
          }
        } catch (err) {
          console.error('[Miden] Failed to restore account', account.id, ':', err);
        }
      }
    };

    restoreAccounts();
  }, [client, accounts]);

  // Save accounts to localStorage whenever they change
  useEffect(() => {
    saveWallets(accounts);
  }, [accounts]);

  const createWallet = useCallback(async () => {
    if (!client) return;

    setIsLoading(true);
    setError(null);

    try {
      const { AccountStorageMode } = await import('@miden-sdk/miden-sdk');
      const account = await client.newWallet(AccountStorageMode.public(), true, 0);
      const id = account.id().toString();

      console.log('[Miden] Wallet created:', id);
      accountObjectsRef.current.set(id, account);

      setAccounts(prev => [...prev, { id, label: `Wallet ${prev.length + 1}`, type: 'wallet' }]);
      return id;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create wallet';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  /**
   * Get fresh AccountId WASM object for SDK calls.
   * CRITICAL: NEVER store and reuse AccountId objects across await boundaries.
   */
  const getAccountId = useCallback((idStr: string): AccountId | string => {
    const account = accountObjectsRef.current.get(idStr);
    return account ? account.id() : idStr;
  }, []);

  const syncState = useCallback(async () => {
    if (!client) return;

    setIsLoading(true);
    setError(null);

    try {
      await client.syncState();

      // Read balances for ALL accounts in the ref (wallets + faucets)
      const newBalances: Record<string, VaultAsset[]> = {};

      for (const [id, accountObj] of accountObjectsRef.current.entries()) {
        try {
          const refreshed = await client.getAccount(accountObj.id());

          if (refreshed) {
            const vault = refreshed.vault();
            const assets = vault.fungibleAssets();
            const vaultAssets: VaultAsset[] = [];

            for (const asset of assets) {
              vaultAssets.push({
                faucetId: asset.faucetId().toString(),
                amount: asset.amount().toString(),
              });
            }

            newBalances[id] = vaultAssets;
            console.log(`[Miden] Balance for ${id}:`, vaultAssets);
          }
        } catch (err) {
          console.error(`[Miden] Error reading balance for ${id}:`, err);
          newBalances[id] = [];
        }
      }

      setBalances(newBalances);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync state');
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  return { accounts, balances, createWallet, syncState, getAccountId, accountObjectsRef, isLoading, error };
}
