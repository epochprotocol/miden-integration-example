import { useCallback, useEffect, useRef } from 'react';
import type { Account, AccountId } from '@miden-sdk/miden-sdk';
import type { WebClient } from '@miden-sdk/react';

interface UseMidenWalletReturn {
  getAccountId: (idStr: string) => AccountId | string;
  accountObjectsRef: React.MutableRefObject<Map<string, Account>>;
}

/**
 * Keeps `Account` WASM handles in a ref for `getAccountId()` (fresh `.id()` per call) for legacy
 * `client.submitNewTransaction` flows. Wallet lists and balances come from `useAccounts` / `useAccount`
 * in UI components instead of this hook.
 */
export function useMidenWallet(
  client: WebClient | null,
  walletAccountIds: readonly string[],
): UseMidenWalletReturn {
  const accountObjectsRef = useRef<Map<string, Account>>(new Map());

  useEffect(() => {
    if (!client || walletAccountIds.length === 0) return;
    let cancelled = false;

    const hydrate = async () => {
      const { AccountId } = await import('@miden-sdk/miden-sdk');
      for (const id of walletAccountIds) {
        if (cancelled) return;
        if (accountObjectsRef.current.has(id)) continue;
        try {
          const accountObj = await client.getAccount(AccountId.fromHex(id));
          if (accountObj && !cancelled) {
            accountObjectsRef.current.set(id, accountObj);
          }
        } catch (err) {
          console.error('[Miden] Failed to hydrate wallet account', id, ':', err);
        }
      }
    };

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [client, walletAccountIds]);

  const getAccountId = useCallback((idStr: string): AccountId | string => {
    const account = accountObjectsRef.current.get(idStr);
    return account ? account.id() : idStr;
  }, []);

  return {
    getAccountId,
    accountObjectsRef,
  };
}
