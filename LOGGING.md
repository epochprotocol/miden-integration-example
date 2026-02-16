# Cross-Chain Intent Logging Guide

This document explains the comprehensive logging added to track cross-chain intent creation from Miden → Smallocator → EVM.

## 🔍 Log Prefixes

All logs use clear prefixes to identify their source:

- **`[CrossChain]`** - Miden integration app (useEpochIntent hook)
- **`[EpochBridge]`** - Epoch bridge service (task data building)
- **`[IntentForm]`** - React UI component (form submission)
- **`[Miden]`** - Miden SDK operations (wallet, faucet, transfer)
- **`[Smallocator]`** - Allocator service backend

## 📝 Miden Integration App Logs

### 1. SDK Initialization
```
[CrossChain] Initializing Epoch SDK...
[CrossChain] Epoch SDK loaded, creating instance with API: http://localhost:3000
[CrossChain] Epoch SDK ready
```

### 2. Intent Form Submission
```
[IntentForm] Starting cross-chain intent submission...
[IntentForm] Form data: { midenAccountId, faucetId, amount, evmAddress, ... }
[IntentForm] Sending P2ID note to allocator: 0x...
[IntentForm] P2ID note sent successfully
[IntentForm] Building cross-chain intent via Epoch SDK...
[IntentForm] Calling onCreateIntent with params: { ... }
[IntentForm] Intent created successfully: { taskTypeString, intentData }
```

### 3. P2ID Note Sending
```
[Miden] Sending tokens via P2ID...
[Miden] Send transaction submitted
```

### 4. Intent Creation & Execution
```
[CrossChain] Creating intent with params: { ... }
[CrossChain] Using Epoch SDK to build intent...
[EpochBridge] Starting cross-chain intent build via Epoch SDK...
[EpochBridge] Building task data params from: { ... }
[EpochBridge] Task data params built: { taskType, intentData, extraData }

[EpochBridge] Step 1: Calling SDK.getTaskData()...
[EpochBridge] SDK.getTaskData() response: { taskTypeString, intentData }

[EpochBridge] Step 2: Calling SDK.solveIntent()...
[EpochBridge] solveIntent params: { isNative, sponsorAddress, taskTypeString, intentData }
[EpochBridge] SDK.solveIntent() response: { resourceLockRequired, transactions, compact, hash }
[CrossChain] Intent created via SDK: { taskTypeString, intentData, solveResult }
```

## 📝 Smallocator Service Logs

### 1. Service Startup
```
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║                   SMALLOCATOR SERVICE STARTING                 ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🚀 Smallocator is running on http://localhost:3000          ║
║                                                                ║
║   API Endpoints:                                               ║
║   • GET  http://localhost:3000/health                          ║
║   • GET  http://localhost:3000/suggested-nonce/:chain/:addr    ║
║   • POST http://localhost:3000/compact                         ║
║   • POST http://localhost:3000/checkIfDepositNeeded            ║
║                                                                ║
║   Allocator Address: 0x...                                     ║
║   Signing Address:   0x...                                     ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

[Smallocator] Waiting for requests...
```

### 2. Health Check
```
[Smallocator] GET /health - Health check request received
[Smallocator] GET /health - Service is healthy: { status, allocatorAddress, ... }
```

### 3. Nonce Generation
```
[Smallocator] GET /suggested-nonce - Request received: { chainId, address }
[Smallocator] GET /suggested-nonce - Nonce generated: 0x...
```

### 4. Compact Submission
```
[Smallocator] POST /compact - Request received: {
  chainId, sponsor, nonce, amount, token, arbiter, isRegisteredOnchain
}
[Smallocator] POST /compact - Compact submitted successfully: { ... }
```

### 5. Deposit Check (SIO Intent)
```
[Smallocator] POST /checkIfDepositNeeded - Request received: {
  chainId, sponsor, nonce, mandate
}
[Smallocator] Sending intent to SIO...
[Smallocator] SIO response received: { resourceLockRequired, transactions }
```

## 🔧 Configuration

### Miden Integration App

Create `.env` file:
```bash
# Allocator Service URL
VITE_ALLOCATOR_URL=http://localhost:3000
```

Default: `http://localhost:3000` if not set

### Smallocator Service

Ensure `.env` has:
```bash
PORT=3000
ALLOCATOR_ADDRESS=0x...
SIGNING_ADDRESS=0x...
```

## 🚀 Running with Logs

### Terminal 1: Smallocator Service
```bash
cd ../smallocator
pnpm dev
```

You'll see the startup banner and then request logs as they come in.

### Terminal 2: Miden Integration
```bash
cd miden-integration
bun dev
```

Open browser console (F12) to see client-side logs.

## 🔍 Tracing a Full Cross-Chain Flow

When you submit a cross-chain intent, you should see logs in this order:

1. **Browser Console:**
   - `[IntentForm]` form submission
   - `[Miden]` P2ID note sending (if allocator configured)
   - `[CrossChain]` SDK intent creation
   - `[EpochBridge]` task data building

2. **Smallocator Terminal:**
   - `[Smallocator] POST /checkIfDepositNeeded` request received
   - `[Smallocator] Sending intent to SIO...`
   - `[Smallocator] SIO response received`
   - `[Smallocator] POST /compact` (if compact is submitted)

## 🐛 Debugging Tips

### Issue: No logs from Smallocator
**Check:**
1. Is smallocator running? (`pnpm dev` in smallocator directory)
2. Is it on the correct port? (default 3000)
3. Is `VITE_ALLOCATOR_URL` set correctly in miden-integration `.env`?

### Issue: SDK not making API calls
**Check:**
1. Browser console: `[CrossChain] SDK not available, generating mock intent data...`
2. This means Epoch SDK couldn't load or no wallet connected
3. Connect MetaMask/wallet on the Cross-Chain tab

### Issue: P2ID note failing
**Check:**
1. Browser console: `[Miden] Send error: Error: expected instance of AccountId`
2. Allocator account ID may be invalid
3. Update `ALLOCATOR_MIDEN_ACCOUNT_ID` in `epoch-bridge.ts` with a real Miden account

## 📊 Log Analysis

### Successful Flow
```
✅ [IntentForm] Starting...
✅ [Miden] Send transaction submitted (P2ID note)
✅ [CrossChain] Step 1: getTaskData() - formats intent data
✅ [EpochBridge] Step 2: solveIntent() - submits to allocator
✅ [Smallocator] POST /checkIfDepositNeeded - Request received
✅ [Smallocator] Sending intent to SIO...
✅ [Smallocator] SIO response received
✅ [Smallocator] POST /compact - Compact submitted successfully
✅ [CrossChain] Intent executed with transactions
```

### Demo Mode (No Allocator Service)
```
⚠️  [IntentForm] Allocator account not configured
✅ [CrossChain] SDK not available, generating mock intent data...
✅ [CrossChain] Mock intent result: { ... }
```

### Error Flow
```
❌ [Miden] Send error: Error: expected instance of AccountId
❌ [IntentForm] P2ID note failed (allocator may not exist)
⚠️  [IntentForm] Building intent data anyway...
✅ [CrossChain] Intent created via SDK (or mock)
```
