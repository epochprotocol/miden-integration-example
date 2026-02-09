import { useState, useCallback } from 'react';
import type { MidenFaucetInfo } from '../types/miden';
import type { WebClient, TransactionProver, Account, AccountId } from '../types/miden-sdk';

interface UseMidenFaucetReturn {
  faucets: MidenFaucetInfo[];
  createFaucet: (symbol: string, decimals: number, maxSupply: bigint) => Promise<string | undefined>;
  mintTokens: (recipientId: string, faucetId: string, amount: bigint) => Promise<boolean | undefined>;
  getFaucetId: (idStr: string) => AccountId | string;
  isLoading: boolean;
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
  accountObjectsRef: React.MutableRefObject<Map<string, Account>>,
): UseMidenFaucetReturn {
  const [faucets, setFaucets] = useState<MidenFaucetInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createFaucet = useCallback(async (symbol: string, decimals: number, maxSupply: bigint) => {
    if (!client) return;

    setIsLoading(true);
    setError(null);

    try {
      const { AccountStorageMode } = await import('@demox-labs/miden-sdk');
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
      setIsLoading(false);
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

    setIsLoading(true);
    setError(null);

    try {
      const { NoteType } = await import('@demox-labs/miden-sdk');

      await client.syncState();

      // IMPORTANT: Call getAccountId()/getFaucetId() fresh for each SDK call —
      // WASM AccountId objects can be freed/GC'd between async operations.
      console.log('[Miden] Minting tokens...');
      const mintTxRequest = client.newMintTransactionRequest(
        getAccountId(recipientIdStr),
        getFaucetId(faucetIdStr),
        NoteType.Public,
        amount,
      );
      await client.submitNewTransaction(getFaucetId(faucetIdStr), mintTxRequest);

      console.log('[Miden] Mint transaction submitted');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mint tokens';
      console.error('[Miden] Mint error:', err);
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [client, getAccountId, getFaucetId]);

  return { faucets, createFaucet, mintTokens, getFaucetId, isLoading, error };
}
