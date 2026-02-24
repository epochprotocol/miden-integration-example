import type { TransactionProver, WebClient } from '@miden-sdk/miden-sdk';
import { MIDEN_CONFIG } from '../config/miden';
// import type { WebClient, TransactionProver } from '../types/miden-sdk';

interface MidenClientState {
  client: WebClient;
  prover: TransactionProver;
}

let clientInstance: WebClient | null = null;
let proverInstance: TransactionProver | null = null;
let initPromise: Promise<MidenClientState> | null = null;

/**
 * Initialize the Miden WASM client (singleton pattern).
 * Safe to call multiple times - subsequent calls return the same promise.
 */
export async function initMiden(): Promise<MidenClientState> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    if (typeof window === 'undefined') {
      throw new Error('Miden SDK can only run in the browser');
    }

    const { WebClient, TransactionProver } = await import('@miden-sdk/miden-sdk');

    clientInstance = await WebClient.createClient(MIDEN_CONFIG.rpcUrl);

    proverInstance = TransactionProver.newRemoteProver(MIDEN_CONFIG.proverUrl);

    const state = await clientInstance.syncState();

    return { client: clientInstance, prover: proverInstance };
  })();

  return initPromise;
}

export function getMidenClient(): WebClient | null {
  return clientInstance;
}

export function getMidenProver(): TransactionProver | null {
  return proverInstance;
}

/**
 * Terminate the Miden client and prover.
 * Use with caution - only call this when you need to fully reset the SDK state.
 */
export function terminateMidenClient(): void {
  if (clientInstance) {
    try {
      clientInstance.terminate();
    } catch {
      // Ignore termination errors
    }
    clientInstance = null;
  }
  if (proverInstance) {
    try {
      proverInstance.free();
    } catch {
      // Ignore cleanup errors
    }
    proverInstance = null;
  }
  initPromise = null;
}
