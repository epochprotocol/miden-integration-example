# Random bridge run report

**Date:** 2026-10-27 (Asia/Calcutta)  
**Command:** `pnpm bridge:random`  
**Configured runs:** 1  
**Result:** Completed successfully (`Finished 1 run(s); 0 failed.`)

## Run summary

- Random direction: **EVM → Miden**
- Random target amount: **8 Miden USDC** (6 decimals)
- Quoted EVM input: **8.004002001000500251 USDC** (18 decimals)
- The quote came from the configured ngrok bridge solver.
- Smallocator registered the compact, checked the deposit requirement, and returned the required claim calldata.
- SIO submitted the Miden transaction and then executed the EVM compact claim.

## Transactions

| Stage             | Network       | Transaction                                                                                                                                                                | Result                                      |
| ----------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Compact deposit   | Sepolia       | [`0x9f42bb4fae0fbb3db2dd0e240b7684fa3a5aa2b8994d8662b8051e5659c46a99`](https://sepolia.etherscan.io/tx/0x9f42bb4fae0fbb3db2dd0e240b7684fa3a5aa2b8994d8662b8051e5659c46a99) | Success, block 12005239                     |
| Miden payout      | Miden testnet | `0x41f09364fcf70fefa326ba298f1ec08ffd6e505f2c1c29a3a3603d641fd61cf5`                                                                                                       | Submitted at height 601460; one output note |
| EVM compact claim | Sepolia       | [`0xe6ac41ab116287c239d42373e1de08085aa15694cda2e0789badca754f0e5f53`](https://sepolia.etherscan.io/tx/0xe6ac41ab116287c239d42373e1de08085aa15694cda2e0789badca754f0e5f53) | Success, block 12005244                     |

Smallocator confirmed the Miden payout note and logged `delivered: 8000000` (8 USDC at 6 decimals). SIO logged `CLAIM_SUCCESS` and removed the claim transaction from its queue.

## Service logs and observations

- **epoch-sio:** Accepted the quote-only check, selected the bridge quote, submitted the proven Miden transaction, queued the EVM claim, and logged `CLAIM_SUCCESS` after the Sepolia transaction succeeded.
- **smallocator:** `/suggested-nonce` and `/compact` returned HTTP 200. The first claim-calldata attempts reported `MIDEN_NOTE_NOT_YET_VISIBLE` as retryable; a later retry validated the note and completed successfully.
- The local fallback solver at `http://localhost:3010` returned `ECONNREFUSED`. The configured ngrok solver still responded and supplied the winning quote, so the run proceeded.
- SIO logged an Etherscan fee-data parsing error, then fetched fee data through its Infura fallback and sent the EVM claim successfully.
- SIO also logged older pending-claim monitor failures during startup; these were for unrelated earlier claim hashes, not this run.

## Identifiers

- Intent hash: `0x558cf8e6395cd09b812cfd06654320f8ddc301e4c4535ee89f44425f9aea622c`
- Miden payout note: `0x3b4e6a877ad7930233d275225c712dfcbbf8a37e1025387502e1af95862d1519`

## Follow-up run: 100-attempt configuration

**Date:** 2026-10-27 (Asia/Calcutta)  
**Configuration:** `RUNS=100`, `INTERVAL_SECONDS=10`  
**Outcome:** Stopped after 6 failed attempts; all six failed before transaction submission with `NO_QUOTE_AVAILABLE`.

SIO logs showed the local fallback solver at `http://localhost:3010` refusing connections and no valid quote from the configured ngrok solver. Smallocator's deposit checks failed when SIO could not return a quote. No transactions were submitted by these six attempts. The runner was stopped instead of repeating the same unavailable-quote requests for the remaining attempts. A later read-only `pnpm bridge:check` confirmed quotes for both directions, so the solver recovered. The local `.env` remains configured for 100 attempts with a 10-second delay.

## Restarted batch and stop

After both read-only quotes succeeded, the 100-attempt run was restarted. It was stopped at the user's request while attempt 18 was starting. The runner had logged intermittent Sepolia `eth_sendRawTransactionSync` timeouts and one `Nonce has already been used` error.

The Sepolia RPC timeouts did not mean the deposit transactions were absent: checking the chain showed **11 successful compact-deposit transactions**, all with successful receipts and no pending transaction from the EVM wallet at the time of the check. The runner could not reliably distinguish those confirmed transactions from RPC failures, so its failed-attempt count is not a reliable count of on-chain deposits. These receipts confirm the EVM deposits only; they do not by themselves confirm final cross-chain delivery.

| Sepolia compact-deposit transaction                                  |    Block | Receipt |
| -------------------------------------------------------------------- | -------: | ------- |
| `0xcccd01842d8b1cc17bd9ce1b204c1a57c271da41de5aa8073746b6dd3305cada` | 12005310 | Success |
| `0xbcef765c7fee15a61caec3a2a5bfa5d10cddfb7b103bc2edba31970551876805` | 12005322 | Success |
| `0x2de2b0ddaa5595299bfc6355480ecd96e19bcb656b810c51d7ba7eed9e0598e9` | 12005331 | Success |
| `0x654a9db5b8bdc60078a45df073c5067ab1e0aaf2da5337a6c930189f5514bcd4` | 12005337 | Success |
| `0x13fd0a9ff79250e5653dd9bd4bcb59677d8b10722ca13a3f297459d30ea648d1` | 12005339 | Success |
| `0xebd3c9377dbb0f6b4c490ffcbf5c38ed962acec6fe675bd7883544ad3a4663e3` | 12005341 | Success |
| `0x9dc7ac76fd7b15711eca28a8b16b457b911a45281119f44939269cf0bf74ba2a` | 12005347 | Success |
| `0x8ba21a8e942b4f124dec20c5ad5bac4e483b56e2bc95f0da7a23024248a40f6a` | 12005352 | Success |
| `0x605b94b5c7c66654ee5cf5d73f6bf02fa57c1b847014d2224078b4332ea340e1` | 12005357 | Success |
| `0x3c63a7d35313dcb8b70884f95fc25ab8a24e698a034313982ccba2f0b8f41c7d` | 12005360 | Success |
| `0xebcac2104854fd58cbfbb851dabf8436ffec88232ab417c4748ec2740c16681a` | 12005361 | Success |

The nonce error followed creation of a Miden collateral note (`0xe97a70534f538fde6d378e6062e1f3eb8be258c3a7a288cb992d69054af548d2`, reclaim height 607967). Its intent submission was rejected as already used; this note's later status was not checked.
