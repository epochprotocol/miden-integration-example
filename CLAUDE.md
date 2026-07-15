# CLAUDE.md

## What this is

A reference dapp for `@epoch-protocol/epoch-intents-sdk`, moving value between
Miden testnet and Epoch's EVM testnet chains. Testnet only.

Two flows, one tab each:

- **Cross-chain bridge** — Miden → EVM. Lock a Miden note, receive ERC-20 on the
  chosen EVM chain.
- **Withdraw to Miden** — EVM → Miden. Pay ERC-20, receive a Miden note.

Both need two wallets connected at once: an EVM one via RainbowKit, and the
Miden wallet adapter. Each flow is a form plus a status panel that polls the
allocator until the intent settles.

React 19 + Vite + TypeScript + Tailwind, wagmi/RainbowKit for EVM, react-query
for server state. See README.md for setup, supported chains and test funds.

## Comments

Keep them minimal. Only comment where the reason is not visible in the code —
a non-obvious constraint, a footgun, or why the obvious approach was rejected.

Do not comment to say what a line does, to justify a change to the reviewer, or
to record what the code used to be. Git history covers that. One line, not a
paragraph. Default to no comment.

## Traps

Things the compiler will not catch here:

- `process` and `__dirname` type-check inside `src/` — `ethers` pulls
  `@types/node` in via a triple-slash reference. They still throw in the
  browser.
- `requestAssets()` opens the Miden wallet's approval prompt. Never let it
  refetch automatically (react-query's `staleTime: 0` + refetch-on-focus
  defaults will pop the wallet on every window focus).
- Any `VITE_*` value is inlined into the client bundle. Nothing here is secret.
