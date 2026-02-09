import { useState, useCallback, useRef } from 'react';
import type { MidenAccount, VaultAsset } from '../types/miden';

export function useMidenWallet(client: any, _prover: any) {
  const [accounts, setAccounts] = useState<MidenAccount[]>([]);
  const [balances, setBalances] = useState<Record<string, VaultAsset[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Store actual Account objects so we can pass .id() to SDK methods
  const accountObjectsRef = useRef<Map<string, any>>(new Map());

  const createWallet = useCallback(async () => {
    if (!client) return;
    setIsLoading(true);
    setError(null);
    try {
      const { AccountStorageMode } = await import('@demox-labs/miden-sdk');
      const account = await client.newWallet(AccountStorageMode.public(), true, 0);
      const id = account.id().toString();
      console.log('[Miden] Wallet created:', id);
      accountObjectsRef.current.set(id, account);
      setAccounts(prev => [...prev, { id, label: `Wallet ${prev.length + 1}`, type: 'wallet' }]);
      return id;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create wallet';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  const getAccountId = useCallback((idStr: string) => {
    const acct = accountObjectsRef.current.get(idStr);
    return acct ? acct.id() : idStr;
  }, []);

  const syncState = useCallback(async () => {
    if (!client) return;
    setIsLoading(true);
    setError(null);
    try {
      await client.syncState();

      // Read balances for ALL accounts in the ref (wallets + faucets)
      const newBalances: Record<string, VaultAsset[]> = {};
      for (const [id, acctObj] of accountObjectsRef.current.entries()) {
        try {
          const refreshed = await client.getAccount(acctObj.id());
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
