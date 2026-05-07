# Epoch × Miden Integration Guide

End-to-end recipe for wiring **Epoch Intents** into a React/Vite dapp that uses **Miden** as collateral source or destination. Mirrors the working example in this repo (`src/`).

Two flows covered:

| Flow | Direction | Collateral | Settlement |
|------|-----------|------------|------------|
| **Cross-chain (deposit)** | Miden → EVM | Miden P2IDE note | EVM token to recipient |
| **Withdraw** | EVM → Miden | ERC-20 on EVM | Miden P2ID note credit |

---

## 1. Architecture

```
[User]
  ├── EVM wallet (RainbowKit / wagmi)        — sponsorship, EVM-side signing
  └── Miden wallet (miden-wallet-adapter)    — Miden account + P2IDE/P2ID send

         │  builds intent
         ▼
[EpochIntentSDK]   (apiBaseUrl → allocator @ :3000)
   getTaskData → getIntentQuote → solveIntent
                                         │
                                         ├── createMidenP2IDNote callback
                                         │     wallet adapter requestSend(SendTransaction)
                                         │     waitForTransaction → outputNotes[0].id
                                         │
                                         ▼
[Allocator / SIO] verifies note, dispatches solver on destination chain
```

Key idea: the **allocator** never custodies funds. User locks Miden assets in a P2IDE note targeted at the allocator. Solver fills the EVM side; allocator consumes the note. If intent fails or expires, user reclaims via `recallHeight`.

---

## 2. Dependencies

```json
{
  "@epoch-protocol/epoch-intents-sdk": "file:../smallocator/sdk",
  "@miden-sdk/miden-sdk": "^0.14.5",
  "@miden-sdk/miden-wallet-adapter-base": "^0.14.5",
  "@miden-sdk/miden-wallet-adapter-react": "^0.14.5",
  "@miden-sdk/react": "^0.14.5",
  "@rainbow-me/rainbowkit": "^2.2.10",
  "wagmi": "^2.14.0",
  "viem": "^2.45.2",
  "@tanstack/react-query": "^5.90.20"
}
```

Vite needs WASM + top-level-await for `@miden-sdk/miden-sdk`:

```ts
// vite.config.ts
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
  plugins: [react(), wasm(), topLevelAwait()],
  worker: { plugins: () => [wasm(), topLevelAwait()], format: 'es' },
  optimizeDeps: { exclude: ['@miden-sdk/miden-sdk'] },
  build: { target: 'esnext' },
});
```

Do **not** set COOP/COEP headers on dev server — breaks Miden's gRPC-Web transport sync.

---

## 3. Provider Tree

Wrap app with `WagmiProvider` → `QueryClientProvider` → `RainbowKitProvider` → `MidenFiSignerProvider`.

```tsx
// src/main.tsx
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { MidenFiSignerProvider } from '@miden-sdk/miden-wallet-adapter-react';
import { AllowedPrivateData, WalletAdapterNetwork } from '@miden-sdk/miden-wallet-adapter-base';

<WagmiProvider config={wagmiConfig}>
  <QueryClientProvider client={new QueryClient()}>
    <RainbowKitProvider>
      <MidenFiSignerProvider
        network={WalletAdapterNetwork.Testnet}
        appName="My App"
        allowedPrivateData={AllowedPrivateData.Assets}
      >
        <App />
      </MidenFiSignerProvider>
    </RainbowKitProvider>
  </QueryClientProvider>
</WagmiProvider>
```

`AllowedPrivateData.Assets` lets `requestAssets()` enumerate user's Miden balances.

---

## 4. Wagmi Config — Real EVM Chains Only

Miden has no EVM chain id. Including it in wagmi `chains` breaks RainbowKit connector init.

```ts
// src/config/wagmi.ts
import { sepolia } from 'viem/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

export const config = getDefaultConfig({
  appName: 'Miden x Epoch Bridge',
  projectId: 'YOUR_WC_PROJECT_ID',
  chains: [sepolia] as const,
});
```

Miden destination uses a **virtual chain id** for SIO routing:

```ts
// src/constants/chains.ts
export const MIDEN_DESTINATION_CHAIN_ID = 999999999;
```

Pass this as `destinationChainId` whenever the intent output lands on Miden.

---

## 5. Miden Wallet Hook

`useMidenFiWallet()` from `@miden-sdk/miden-wallet-adapter-react` gives `connect`, `address`, `requestAssets`, `requestSend`, `waitForTransaction`. Normalize the address (bech32 / hex variants) to canonical hex via `AccountId.fromBech32(...).toString()`.

```ts
// src/hooks/useMidenWalletAdapter.ts (excerpt)
import { useMidenFiWallet } from '@miden-sdk/miden-wallet-adapter-react';
import { useAssetMetadata, toBech32AccountId } from '@miden-sdk/react';
import { AccountId, Address } from '@miden-sdk/miden-sdk';

const { connected, connect, address, requestAssets } = useMidenFiWallet();
const raw = await requestAssets();           // [{ faucetId, amount }]
const { assetMetadata } = useAssetMetadata(raw.map(a => a.faucetId));
// metadata holds { symbol, decimals } per faucet
```

Address normalization handles `mtst..._...` bech32 addresses and `0x...` hex IDs — see `normalizeAccountId` in `useMidenWalletAdapter.ts`.

---

## 6. SDK Initialization

Lazy-load to avoid pulling Miden WASM on routes that don't need it. Cross-chain (Miden → EVM) needs a wallet client whose `chain.id` is dummied so SDK doesn't try EVM-route the Miden side:

```ts
// src/hooks/useEpochIntent.ts (excerpt)
import { useWalletClient } from 'wagmi';

const { data: walletClient } = useWalletClient();

useEffect(() => {
  if (!walletClient) return;
  import('@epoch-protocol/epoch-intents-sdk').then(({ EpochIntentSDK }) => {
    const midenWalletClient = {
      ...walletClient,
      chain: { ...walletClient.chain, id: 999999999 },  // override
    };
    setSdk(new EpochIntentSDK({
      apiBaseUrl: 'http://localhost:3000',
      walletClient: midenWalletClient,
    }));
  });
}, [walletClient]);
```

Withdraw flow (EVM → Miden) uses the **real** wallet client without override — see `useWithdrawIntent.ts`.

---

## 7. Cross-chain Flow (Miden → EVM)

### 7.1 Build task data params

`taskType: 'gettokenout'`, reverse-quote shape (`tokenInAmount: '0'`, fixed `minTokenOut`):

```ts
const taskDataParams = {
  taskType: 'gettokenout',
  intentData: {
    isNative: false,                                   // tokenIn is Miden, not EVM-native
    depositTokenAddress: '0x0000...0000',              // zero — Miden source
    tokenInAmount: '0',                                // reverse quote
    outputTokenAddress: '0x...',                       // ERC-20 on destination
    minTokenOut: '10',                                 // base units, user-specified floor
    destinationChainId: '11155111',                    // Sepolia
    protocolHashIdentifier: '0x0000...',
    recipient: evmAddress,
  },
  extraDataTypestring:
    'string midenSourceAccount,string midenFaucetId,string midenNoteType,string midenNoteId,uint256 midenReclaimHeight',
  extraData: {
    midenSourceAccount: midenAccountIdHex,
    midenFaucetId: midenFaucetIdHex,
    midenNoteType: 'P2IDE',                            // recallable
    midenNoteId: '',                                   // filled by allocator after note is created
    midenReclaimHeight: '1000',                        // blocks
  },
};
```

### 7.2 Quote → Confirm

```ts
const { taskTypeString, intentData } = await sdk.getTaskData(taskDataParams);
const quoteResult = await sdk.getIntentQuote({
  sponsorAddress: evmAddress,
  taskTypeString,
  intentData,
  isNative: false,
});
// quoteResult.tokenIn = required Miden amount in base units
```

Show the user `formatUnits(BigInt(quoteResult.tokenIn), midenFaucetDecimals)` as the deposit they'll spend, then call `solveIntent` with a `createMidenP2IDNote` callback.

### 7.3 The P2IDE note callback

`solveIntent` invokes this callback when the allocator needs the resource lock. You build a P2IDE note via the wallet adapter targeting `allocatorId`:

```ts
import { SendTransaction } from '@miden-sdk/miden-wallet-adapter-base';

const createMidenP2IDNote: SolveIntentParams['createMidenP2IDNote'] =
  async (faucetId, amount, allocatorId) => {
    const payload = new SendTransaction(
      midenAccountIdHex,
      allocatorId,
      faucetId,
      'public',                  // public note so allocator can read+consume
      Number(BigInt(amount)),    // amount enforced to fit safe int
    );
    const txId = await requestSend(payload);
    const finalized = await waitForTransaction(txId, 120_000);
    const noteId = finalized.outputNotes?.[0]?.id().toString();
    if (!noteId) return { success: false, error: 'No output note id' };
    return { success: true, noteId };
  };

const result = await sdk.solveIntent({
  isNative: false,
  sponsorAddress: evmAddress,
  taskTypeString,
  intentData,
  quoteResult,                    // pre-fetched from step 7.2
  collateralType: 'miden',
  midenFaucetId: faucetIdHex,
  midenSourceAccount: midenAccountIdHex,
  createMidenP2IDNote,
});
```

`result.intentNonce` is what you poll for status.

---

## 8. Withdraw Flow (EVM → Miden)

Reverse-quote shape: `destinationChainId = 999999999`, `outputTokenAddress = 0x0`, `minTokenOut` in Miden base units.

```ts
const taskDataParams = {
  taskType: 'gettokenout',
  intentData: {
    isNative: false,
    depositTokenAddress: evmTokenAddress,          // ERC-20 on Sepolia
    tokenInAmount: '0',                            // reverse-quote (or fixed wei for forward)
    outputTokenAddress: '0x0000...0000',           // zero — Miden output
    minTokenOut: minMidenBaseUnits,                // floor in Miden base units
    destinationChainId: '999999999',               // MIDEN
    protocolHashIdentifier: '0x0000...',
    recipient: evmSourceAddress,                   // refund target
  },
  extraDataTypestring:
    'string midenRecipientAccount,string midenFaucetId,string midenNoteType',
  extraData: {
    midenRecipientAccount: midenRecipientHex,
    midenFaucetId: midenFaucetIdHex,
    midenNoteType: 'P2ID',                         // non-recallable credit
  },
};
```

`sdk.solveIntent({ collateralType: 'evm', sponsorAddress: evmSourceAddress, ... })` — no `createMidenP2IDNote` here. Solver delivers a P2ID note to the Miden recipient.

---

## 9. Status Polling

Allocator exposes `GET /miden/status/:userAddress/:intentNonce`:

```ts
// src/hooks/useIntentStatus.ts
const res = await fetch(
  `${ALLOCATOR_URL}/miden/status/${userAddress}/${intentNonce}`
);
const { evmCompleted, evmTransactionHash, midenConsumed, midenConsumeError } = await res.json();
```

Poll every 5s. Stop when `evmCompleted && midenConsumed`.

---

## 10. Decimal Handling

Two sources of truth — keep them aligned:

- **Miden faucet decimals**: from `useAssetMetadata(faucetId)` (returns `{ symbol, decimals }`).
- **EVM token decimals**: hardcoded list per chain or fetched on demand.

Helper that survives backend decimal mismatches:

```ts
// src/services/epoch-bridge.ts
export function formatQuoteTokenIn(raw, tokenDecimals, quoteDecimals?) {
  if (!raw || raw === '0') return 'calculated at execution';
  const dec = quoteDecimals === tokenDecimals ? quoteDecimals : tokenDecimals;
  if (/^\d+\.\d+$/.test(raw)) return formatUnits(parseUnits(raw, dec), dec);
  return formatUnits(BigInt(raw), dec);
}
```

Integer strings = base units → `formatUnits(BigInt(...), dec)`. Never `parseUnits` an integer string.

---

## 11. Account ID Normalization

Inputs come in three forms: hex (`0x...`), bech32 account (`mtst1...`), bech32 address (`mtst..._...`). Always normalize to canonical hex before sending to allocator:

```ts
import { AccountId, Address } from '@miden-sdk/miden-sdk';

function normalizeMidenIdToHex(id: string): string {
  const raw = id.trim();
  if (raw.startsWith('0x')) return AccountId.fromHex(raw).toString();
  if (/^[0-9a-fA-F]+$/.test(raw)) return AccountId.fromHex(`0x${raw}`).toString();
  if (raw.includes('_')) return Address.fromBech32(raw).accountId().toString();
  return AccountId.fromBech32(raw).toString();
}
```

---

## 12. Environment

```bash
# .env
VITE_EPOCH_API_BASE_URL=http://localhost:3000
VITE_ALLOCATOR_URL=http://localhost:3000
```

Allocator (smallocator) must run before app. See repo root `CLAUDE.md` for stack startup.

---

## 13. Minimum Integration Checklist

1. Install deps (section 2).
2. Add `vite-plugin-wasm` + `vite-plugin-top-level-await`.
3. Wrap app with provider tree (section 3).
4. Wagmi config with **real EVM chains only** (section 4).
5. Build `useMidenWalletAdapter` (section 5).
6. Build `useEpochIntent` with chain-id-overridden wallet client (section 6).
7. For Miden→EVM: implement `createMidenP2IDNote` callback (section 7.3).
8. For EVM→Miden: pass `collateralType: 'evm'` and `MIDEN_DESTINATION_CHAIN_ID` (section 8).
9. Poll `/miden/status/:user/:nonce` (section 9).
10. Normalize all Miden IDs to hex before SDK calls (section 11).

---

## 14. File Map (this repo)

| File | Role |
|------|------|
| `src/main.tsx` | Provider tree |
| `src/config/wagmi.ts` | Wagmi + RainbowKit config |
| `src/constants/chains.ts` | `MIDEN_DESTINATION_CHAIN_ID` |
| `src/services/epoch-bridge.ts` | `buildEpochTaskDataParams`, `getCrossChainQuote`, `buildCrossChainIntent`, EVM→Miden equivalents |
| `src/hooks/useEpochIntent.ts` | Cross-chain (Miden → EVM) state machine |
| `src/hooks/useWithdrawIntent.ts` | Withdraw (EVM → Miden) state machine |
| `src/hooks/useMidenWalletAdapter.ts` | Wallet connect + asset listing |
| `src/hooks/useMidenTransfer.ts` | `useSend` wrapper for arbitrary P2ID/P2IDE |
| `src/hooks/useIntentStatus.ts` | Allocator status polling |
| `src/components/crosschain/IntentForm.tsx` | Cross-chain UI + `createMidenP2IDNote` callback |
| `src/components/crosschain/WithdrawForm.tsx` | Withdraw UI |

---

## 15. Common Pitfalls

- **Miden in wagmi chains**: breaks RainbowKit. Keep wagmi to real EVM chains only.
- **Frontend decimals mismatch**: backend may return `midenFaucetDecimals` that disagrees. Treat user-selected faucet decimals as source of truth.
- **`parseUnits` on base-unit string**: silently 10×s the value. Use `formatUnits(BigInt(raw), dec)`.
- **COOP/COEP on dev server**: blocks Miden gRPC-Web sync. Don't set them.
- **Forgetting `intentNonce`**: status polling requires `intentResult.intentNonce` + EVM recipient.
- **Public vs private note**: cross-chain MUST be `'public'` so allocator can consume.
- **Chain id override missing**: SDK tries to EVM-route Miden source → fails. Override `walletClient.chain.id` to `999999999` in cross-chain hook only.
