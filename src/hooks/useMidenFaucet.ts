import { useState, useCallback, useEffect, type MutableRefObject } from 'react';
import type { MidenFaucetInfo } from '../types/miden';
// import type { WebClient, TransactionProver, Account, AccountId } from '../types/miden-sdk';
import { loadFaucets, saveFaucets } from '../utils/persistence';
import type { Account, AccountId, TransactionProver, WebClient } from '@miden-sdk/miden-sdk';

interface UseMidenFaucetReturn {
  faucets: MidenFaucetInfo[];
  createFaucet: (symbol: string, decimals: number, maxSupply: bigint) => Promise<string | undefined>;
  mintTokens: (recipientId: string, faucetId: string, amount: bigint) => Promise<boolean | undefined>;
  getFaucetId: (idStr: string) => AccountId | string;
  /** @deprecated use isCreatingFaucet or isMinting */
  isLoading: boolean;
  isCreatingFaucet: boolean;
  isMinting: boolean;
  error: string | null;
}

/**
 * React hook for managing Miden faucets and minting tokens.
 *
 * IMPORTANT: Uses the same accountObjectsRef as useMidenWallet to store
 * faucet Account objects. Calls .id() fresh for each SDK method call to avoid
 * WASM garbage collection issues.
 */
export function useMidenFaucet(
  client: WebClient | null,
  _prover: TransactionProver | null,
  getAccountId: (idStr: string) => AccountId | string,
  accountObjectsRef: MutableRefObject<Map<string, Account>>,
): UseMidenFaucetReturn {
  const [faucets, setFaucets] = useState<MidenFaucetInfo[]>(() => loadFaucets());
  const [isCreatingFaucet, setIsCreatingFaucet] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore faucet Account WASM objects from client when available
  useEffect(() => {
    if (!client || faucets.length === 0) return;

    const restoreFaucets = async () => {
      console.log('[Miden] Restoring', faucets.length, 'faucets from storage');
      const { AccountId } = await import('@miden-sdk/miden-sdk');

      for (const faucet of faucets) {
        try {
          // Skip if already loaded
          if (accountObjectsRef.current.has(faucet.id)) continue;

          const accountId = AccountId.fromHex(faucet.id);
          const accountObj = await client.getAccount(accountId);

          if (accountObj) {
            accountObjectsRef.current.set(faucet.id, accountObj);
            console.log('[Miden] Restored faucet:', faucet.id);
          }
        } catch (err) {
          console.error('[Miden] Failed to restore faucet', faucet.id, ':', err);
        }
      }
    };

    restoreFaucets();
  }, [client, faucets, accountObjectsRef]);

  // Save faucets to localStorage whenever they change
  useEffect(() => {
    saveFaucets(faucets);
  }, [faucets]);

  const createFaucet = useCallback(async (symbol: string, decimals: number, maxSupply: bigint) => {
    if (!client) return;

    setIsCreatingFaucet(true);
    setError(null);

    try {
      const { AccountStorageMode } = await import('@miden-sdk/miden-sdk');
      const account = await client.newFaucet(
        AccountStorageMode.public(),
        false,
        symbol,
        decimals,
        maxSupply,
        0
      );
      const id = account.id().toString();

      console.log('[Miden] Faucet created:', id);

      // Store in shared ref so balance panel can read it
      accountObjectsRef.current.set(id, account);

      const faucet: MidenFaucetInfo = {
        id,
        label: `${symbol} Faucet`,
        type: 'faucet',
        symbol,
        decimals,
        maxSupply: maxSupply.toString(),
      };

      setFaucets(prev => [...prev, faucet]);
      return id;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create faucet';
      setError(message);
      throw err;
    } finally {
      setIsCreatingFaucet(false);
    }
  }, [client, accountObjectsRef]);

  /**
   * Get fresh AccountId WASM object for SDK calls.
   * CRITICAL: NEVER store and reuse AccountId objects across await boundaries.
   */
  const getFaucetId = useCallback((idStr: string): AccountId | string => {
    const account = accountObjectsRef.current.get(idStr);
    return account ? account.id() : idStr;
  }, [accountObjectsRef]);

  const mintTokens = useCallback(async (
    recipientIdStr: string,
    faucetIdStr: string,
    amount: bigint,
  ) => {
    if (!client) return;

    setIsMinting(true);
    setError(null);

    try {
      const { NoteType, AccountId } = await import('@miden-sdk/miden-sdk');

      await client.syncState();

      // IMPORTANT: Call getAccountId()/getFaucetId() fresh for each SDK call —
      // WASM AccountId objects can be freed/GC'd between async operations.
      // If the account isn't in our ref (returns string), parse via AccountId.fromHex().
      const resolveId = (raw: AccountId | string): AccountId =>
        typeof raw === 'string' ? AccountId.fromHex(raw) : raw;

      console.log('[Miden] Minting tokens...');
      const mintTxRequest = client.newMintTransactionRequest(
        resolveId(getAccountId(recipientIdStr)),
        resolveId(getFaucetId(faucetIdStr)),
        NoteType.Public,
        amount,
      );
      await client.submitNewTransaction(resolveId(getFaucetId(faucetIdStr)), mintTxRequest);

      console.log('[Miden] Mint transaction submitted');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mint tokens';
      console.error('[Miden] Mint error:', err);
      setError(message);
      throw err;
    } finally {
      setIsMinting(false);
    }
  }, [client, getAccountId, getFaucetId]);

  return {
    faucets,
    createFaucet,
    mintTokens,
    getFaucetId,
    isLoading: isCreatingFaucet || isMinting,
    isCreatingFaucet,
    isMinting,
    error,
  };
}
