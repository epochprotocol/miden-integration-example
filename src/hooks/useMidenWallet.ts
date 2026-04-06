import { useState, useCallback, useRef, useEffect } from 'react';
import type { MidenAccount, VaultAsset } from '../types/miden';
import { loadWallets, saveWallets } from '../utils/persistence';
import type { Account, AccountId, WebClient } from '@miden-sdk/miden-sdk';

interface UseMidenWalletReturn {
  accounts: MidenAccount[];
  balances: Record<string, VaultAsset[]>;
  createWallet: () => Promise<string | undefined>;
  syncState: () => Promise<void>;
  getAccountId: (idStr: string) => AccountId | string;
  accountObjectsRef: React.MutableRefObject<Map<string, Account>>;
  /** @deprecated use isCreatingWallet or isSyncing */
  isLoading: boolean;
  isCreatingWallet: boolean;
  isSyncing: boolean;
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
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store actual Account WASM objects so we can call .id() fresh for each SDK call
  const accountObjectsRef = useRef<Map<string, Account>>(new Map());

  // Restore user wallets from localStorage on init
  const initDoneRef = useRef(false);
  useEffect(() => {
    if (!client || initDoneRef.current) return;
    initDoneRef.current = true;

    const restoreAccounts = async () => {
      const { AccountId } = await import('@miden-sdk/miden-sdk');

      const savedAccounts = loadWallets();
      if (savedAccounts.length > 0) {
        console.log('[Miden] Restoring', savedAccounts.length, 'accounts from storage');
        for (const account of savedAccounts) {
          try {
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
      }
    };

    restoreAccounts();
  }, [client]);

  // Restore WASM objects when accounts change (e.g. after creating a new wallet)
  // but skip initial load (handled by restoreAccounts above).
  const prevAccountCountRef = useRef(accounts.length);
  useEffect(() => {
    if (!client || accounts.length <= prevAccountCountRef.current) {
      prevAccountCountRef.current = accounts.length;
      return;
    }
    prevAccountCountRef.current = accounts.length;

    // Only restore newly added accounts
    const newAccounts = accounts.filter(a => !accountObjectsRef.current.has(a.id));
    if (newAccounts.length === 0) return;

    const restoreNew = async () => {
      const { AccountId } = await import('@miden-sdk/miden-sdk');
      for (const account of newAccounts) {
        try {
          const accountId = AccountId.fromHex(account.id);
          const accountObj = await client.getAccount(accountId);
          if (accountObj) {
            accountObjectsRef.current.set(account.id, accountObj);
          }
        } catch (err) {
          console.error('[Miden] Failed to restore new account', account.id, ':', err);
        }
      }
    };
    restoreNew();
  }, [client, accounts]);

  // Save accounts to localStorage whenever they change
  useEffect(() => {
    saveWallets(accounts);
  }, [accounts]);

  const createWallet = useCallback(async () => {
    if (!client) return;

    setIsCreatingWallet(true);
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
      setIsCreatingWallet(false);
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

    setIsSyncing(true);
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
      setIsSyncing(false);
    }
  }, [client]);

  return {
    accounts,
    balances,
    createWallet,
    syncState,
    getAccountId,
    accountObjectsRef,
    isLoading: isCreatingWallet || isSyncing,
    isCreatingWallet,
    isSyncing,
    error,
  };
}
