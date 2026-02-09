import { MIDEN_CONFIG } from '../config/miden';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let clientInstance: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let proverInstance: any = null;
let initPromise: Promise<{ client: any; prover: any }> | null = null;

export async function initMiden() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (typeof window === 'undefined') {
      throw new Error('Miden SDK can only run in the browser');
    }

    console.log('[Miden] Importing SDK...');
    const { WebClient, TransactionProver } = await import('@demox-labs/miden-sdk');

    console.log('[Miden] Creating client...');
    clientInstance = await WebClient.createClient(MIDEN_CONFIG.rpcUrl);
    console.log('[Miden] Client created');

    console.log('[Miden] Creating remote prover...');
    proverInstance = TransactionProver.newRemoteProver(MIDEN_CONFIG.proverUrl);
    console.log('[Miden] Prover created');

    console.log('[Miden] Syncing state...');
    const state = await clientInstance.syncState();
    console.log('[Miden] Synced to block:', state.blockNum());

    return { client: clientInstance, prover: proverInstance };
  })();

  return initPromise;
}

export function getMidenClient() {
  return clientInstance;
}

export function getMidenProver() {
  return proverInstance;
}

export function terminateMidenClient() {
  if (clientInstance) {
    try { clientInstance.terminate(); } catch { /* */ }
    clientInstance = null;
  }
  if (proverInstance) {
    try { proverInstance.free(); } catch { /* */ }
    proverInstance = null;
  }
  initPromise = null;
}
