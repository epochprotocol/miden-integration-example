import type { MidenAccount, MidenFaucetInfo } from '../types/miden';

const STORAGE_KEYS = {
  WALLETS: 'miden_wallets',
  FAUCETS: 'miden_faucets',
} as const;

/**
 * Save wallet accounts to localStorage
 */
export function saveWallets(accounts: MidenAccount[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(accounts));
  } catch (err) {
    console.error('[Persistence] Failed to save wallets:', err);
  }
}

/**
 * Load wallet accounts from localStorage
 */
export function loadWallets(): MidenAccount[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.WALLETS);
    if (!data) return [];
    const accounts = JSON.parse(data) as MidenAccount[];
    return accounts;
  } catch (err) {
    console.error('[Persistence] Failed to load wallets:', err);
    return [];
  }
}

/**
 * Save faucets to localStorage
 */
export function saveFaucets(faucets: MidenFaucetInfo[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FAUCETS, JSON.stringify(faucets));
  } catch (err) {
    console.error('[Persistence] Failed to save faucets:', err);
  }
}

/**
 * Load faucets from localStorage
 */
export function loadFaucets(): MidenFaucetInfo[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.FAUCETS);
    if (!data) return [];
    const faucets = JSON.parse(data) as MidenFaucetInfo[];
    return faucets;
  } catch (err) {
    console.error('[Persistence] Failed to load faucets:', err);
    return [];
  }
}

/**
 * Delete all IndexedDB databases used by the Miden SDK.
 * The SDK stores blockchain state (blocks, notes, accounts) in IndexedDB.
 * Stale or version-mismatched data causes deserialization errors on transaction execution.
 */
async function clearMidenIndexedDB(): Promise<void> {
  try {
    const dbs = await indexedDB.databases();
    await Promise.all(
      dbs.map(({ name }) => {
        if (!name) return Promise.resolve();
        return new Promise<void>((resolve) => {
          const req = indexedDB.deleteDatabase(name);
          req.onsuccess = () => resolve();
          req.onerror = () => resolve(); // best-effort
          req.onblocked = () => resolve();
        });
      }),
    );
    console.log('[Persistence] Cleared Miden IndexedDB stores');
  } catch (err) {
    console.error('[Persistence] Failed to clear IndexedDB:', err);
  }
}

/**
 * Clear all persisted data — localStorage accounts/faucets AND the Miden SDK's IndexedDB.
 * Must be awaited before reloading so the DB deletion completes.
 */
export async function clearPersistedData(): Promise<void> {
  try {
    localStorage.removeItem(STORAGE_KEYS.WALLETS);
    localStorage.removeItem(STORAGE_KEYS.FAUCETS);
  } catch (err) {
    console.error('[Persistence] Failed to clear localStorage:', err);
  }
  await clearMidenIndexedDB();
}
