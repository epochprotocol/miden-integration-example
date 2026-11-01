# Graph Report - miden-integration-example (2026-10-29)

## Corpus Check

- 109 files · ~62,326 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary

- 697 nodes · 998 edges · 63 communities (47 shown, 16 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness

- Built from commit: `86d08f48`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)

- IntentDestinationFields.tsx
- dependencies
- epoch-bridge.ts
- devDependencies
- WithdrawForm.tsx
- compilerOptions
- IntentForm.tsx
- What You Must Do When Invoked
- components.json
- What You Must Do When Invoked
- scripts
- .prettierrc.json
- What You Must Do When Invoked
- What You Must Do When Invoked
- Explaining and configuring rules
- graphify reference: extra exports and benchmark
- graphify reference: extra exports and benchmark
- graphify reference: extra exports and benchmark
- graphify reference: extra exports and benchmark
- Miden ⇄ EVM Epoch Integration Example
- CLAUDE.md
- graphify reference: query, path, explain
- graphify reference: query, path, explain
- graphify reference: query, path, explain
- graphify reference: query, path, explain
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- graphify.js
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- AGENTS.md
- graphify
- .claude/skills/graphify/references/extraction-spec.md
- .codex/skills/graphify/references/extraction-spec.md
- .opencode/skills/graphify/references/extraction-spec.md
- agent/skills/graphify/references/extraction-spec.md
- EVM Mainnet Chains Implementation Plan
- evm-tokens.ts
- EVM Mainnet Chains Design
- vite.config.ts
- Random bridge run report
- App.tsx

## God Nodes (most connected - your core abstractions)

1. `compilerOptions` - 23 edges
2. `cn()` - 18 edges
3. `scripts` - 13 edges
4. `What You Must Do When Invoked` - 12 edges
5. `What You Must Do When Invoked` - 12 edges
6. `What You Must Do When Invoked` - 12 edges
7. `What You Must Do When Invoked` - 12 edges
8. `IntentForm()` - 11 edges
9. `getMidenNetworkConfig()` - 11 edges
10. `isNativeEvmTokenAddress()` - 11 edges

## Surprising Connections (you probably didn't know these)

- `toAccountId()` --calls--> `normalizeMidenIdToHex()` [EXTRACTED]
  scripts/random-bridge-runner.ts → src/services/epoch-bridge.ts
- `prepareBridge()` --calls--> `getCrossChainQuote()` [EXTRACTED]
  scripts/random-bridge-runner.ts → src/services/epoch-bridge.ts
- `prepareBridge()` --calls--> `getEVMToMidenQuote()` [EXTRACTED]
  scripts/random-bridge-runner.ts → src/services/epoch-bridge.ts
- `runOne()` --calls--> `buildCrossChainIntent()` [EXTRACTED]
  scripts/random-bridge-runner.ts → src/services/epoch-bridge.ts
- `runOne()` --calls--> `buildEVMToMidenIntent()` [EXTRACTED]
  scripts/random-bridge-runner.ts → src/services/epoch-bridge.ts

## Import Cycles

- None detected.

## Communities (63 total, 16 thin omitted)

### Community 0 - "IntentDestinationFields.tsx"

Cohesion: 0.14
Nodes (24): IntentDestinationFields(), Props, Props, Props, Props, WithdrawTokenFields(), Button, ButtonProps (+16 more)

### Community 1 - "dependencies"

Cohesion: 0.05
Nodes (43): class-variance-authority, clsx, @epoch-protocol/epoch-intents-sdk, @fontsource-variable/jetbrains-mono, @metamask/sdk, @miden-sdk/miden-sdk, @miden-sdk/miden-wallet-adapter-base, @miden-sdk/miden-wallet-adapter-react (+35 more)

### Community 2 - "epoch-bridge.ts"

Cohesion: 0.08
Nodes (49): bindingAttachment(), Config, createEvmClients(), hexBytes(), loadConfig(), main(), makeP2IDENoteFactory(), nonNegativeInteger() (+41 more)

### Community 3 - "devDependencies"

Cohesion: 0.05
Nodes (43): autoprefixer, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, husky, lint-staged (+35 more)

### Community 4 - "WithdrawForm.tsx"

Cohesion: 0.11
Nodes (34): IntentFlowStatus, IntentStatus(), RowProps, StatusRow(), WITHDRAW_DEPOSIT_TOAST_ID, WITHDRAW_SETTLE_TOAST_ID, WithdrawAccountFields(), WithdrawForm() (+26 more)

### Community 5 - "compilerOptions"

Cohesion: 0.06
Nodes (32): DOM, DOM.Iterable, ES2022, node, scripts, src, vite/client, vite.config.ts (+24 more)

### Community 6 - "IntentForm.tsx"

Cohesion: 0.09
Nodes (27): ExplorerHashCard(), Props, Tone, TONE_STYLES, ToneStyle, IntentDestination, IntentSourceAssetField(), Props (+19 more)

### Community 7 - "What You Must Do When Invoked"

Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 8 - "components.json"

Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 9 - "What You Must Do When Invoked"

Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 10 - "scripts"

Cohesion: 0.11
Nodes (17): name, private, scripts, bridge:check, bridge:random, build, dev, doctor (+9 more)

### Community 11 - ".prettierrc.json"

Cohesion: 0.29
Nodes (6): arrowParens, printWidth, semi, singleQuote, tabWidth, trailingComma

### Community 12 - "What You Must Do When Invoked"

Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 13 - "What You Must Do When Invoked"

Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 14 - "Explaining and configuring rules"

Cohesion: 0.14
Nodes (12): Commands, Config shape, Decision guide, Educating the user, Explaining and configuring rules, Workflow, After making React code changes:, Command (+4 more)

### Community 15 - "graphify reference: extra exports and benchmark"

Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 18 - "graphify reference: extra exports and benchmark"

Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 19 - "graphify reference: extra exports and benchmark"

Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 20 - "graphify reference: extra exports and benchmark"

Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 21 - "Miden ⇄ EVM Epoch Integration Example"

Cohesion: 0.20
Nodes (9): Key Files, Miden ⇄ EVM Epoch Integration Example, Notes, Random bridge runner, Run Locally, Stack, Supported testnet chains, Test Funds (+1 more)

### Community 22 - "CLAUDE.md"

Cohesion: 0.33
Nodes (4): Comments, graphify, Traps, What this is

### Community 23 - "graphify reference: query, path, explain"

Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 24 - "graphify reference: query, path, explain"

Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 25 - "graphify reference: query, path, explain"

Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 26 - "graphify reference: query, path, explain"

Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 27 - "graphify reference: add a URL and watch a folder"

Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 28 - "graphify reference: commit hook and native CLAUDE.md integration"

Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 29 - "graphify reference: incremental update and cluster-only"

Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 30 - "graphify reference: add a URL and watch a folder"

Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 31 - "graphify reference: commit hook and native CLAUDE.md integration"

Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 32 - "graphify reference: incremental update and cluster-only"

Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 33 - "graphify reference: add a URL and watch a folder"

Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 34 - "graphify reference: commit hook and native CLAUDE.md integration"

Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 35 - "graphify reference: incremental update and cluster-only"

Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 36 - "graphify reference: add a URL and watch a folder"

Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 37 - "graphify reference: commit hook and native CLAUDE.md integration"

Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 38 - "graphify reference: incremental update and cluster-only"

Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 54 - "EVM Mainnet Chains Implementation Plan"

Cohesion: 0.25
Nodes (7): EVM Mainnet Chains Implementation Plan, Global Constraints, Review Focus, Self-review, Task 1: Environment-aware network context and providers, Task 2: Chain and token registries for both environments, Task 3: Scope flow choices to the active environment and chain

### Community 55 - "evm-tokens.ts"

Cohesion: 0.21
Nodes (11): CUSTOM_TOKEN_DEFAULT_DECIMALS, TOKEN_CUSTOM, WITHDRAW_TOKENS, BY_ADDR, EPOCH_TESTNET_TOKENS, EvmToken, findEvmToken(), getEvmTokenDecimals() (+3 more)

### Community 56 - "EVM Mainnet Chains Design"

Cohesion: 0.25
Nodes (7): Approaches, Constraints, EVM Mainnet Chains Design, Goals, Implementation calls, Intent, Non-goals

### Community 61 - "Random bridge run report"

Cohesion: 0.25
Nodes (7): Follow-up run: 100-attempt configuration, Identifiers, Random bridge run report, Restarted batch and stop, Run summary, Service logs and observations, Transactions

### Community 62 - "App.tsx"

Cohesion: 0.09
Nodes (25): App(), Header(), Props, TabNav(), tabs, MidenNetworkApp(), CrosschainTab(), DEFAULT_MIDEN_NETWORK (+17 more)

## Knowledge Gaps

- **362 isolated node(s):** `semi`, `singleQuote`, `trailingComma`, `printWidth`, `tabWidth` (+357 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `scripts`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `scripts`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `semi`, `singleQuote`, `trailingComma` to the rest of the system?**
  _362 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `IntentDestinationFields.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13725490196078433 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.046511627906976744 - nodes in this community are weakly interconnected._
- **Should `epoch-bridge.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08182349503214495 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.046511627906976744 - nodes in this community are weakly interconnected._
