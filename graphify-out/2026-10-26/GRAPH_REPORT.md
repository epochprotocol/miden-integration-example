# Graph Report - miden-integration-example (2026-10-09)

## Corpus Check

- 104 files · ~57,645 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary

- 637 nodes · 964 edges · 56 communities (39 shown, 15 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness

- Built from commit: `4bcc1cca`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)

- cn
- dependencies
- IntentForm.tsx
- devDependencies
- WithdrawTab.tsx
- compilerOptions
- useMidenWalletAdapter.ts
- What You Must Do When Invoked
- components.json
- What You Must Do When Invoked
- package.json
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
- WithdrawForm.tsx
- main.tsx

## God Nodes (most connected - your core abstractions)

1. `compilerOptions` - 23 edges
2. `react` - 18 edges
3. `cn()` - 18 edges
4. `@epoch-protocol/epoch-intents-sdk` - 13 edges
5. `What You Must Do When Invoked` - 12 edges
6. `What You Must Do When Invoked` - 12 edges
7. `What You Must Do When Invoked` - 12 edges
8. `What You Must Do When Invoked` - 12 edges
9. `scripts` - 10 edges
10. `IntentForm()` - 10 edges

## Surprising Connections (you probably didn't know these)

- `Props` --references--> `MidenAssetOption` [EXTRACTED]
  src/components/crosschain/intent/IntentSourceAssetField.tsx → src/types/miden.ts
- `IntentForm()` --calls--> `getMidenFaucetDecimals()` [EXTRACTED]
  src/components/crosschain/IntentForm.tsx → src/constants/miden-tokens.ts
- `IntentForm()` --calls--> `useIntentSettlementView()` [EXTRACTED]
  src/components/crosschain/IntentForm.tsx → src/hooks/useIntentSettlementView.ts
- `IntentForm()` --calls--> `midenscanNoteUrl()` [EXTRACTED]
  src/components/crosschain/IntentForm.tsx → src/lib/explorers.ts
- `IntentForm()` --calls--> `extractIntentIdentity()` [EXTRACTED]
  src/components/crosschain/IntentForm.tsx → src/lib/intent-result.ts

## Import Cycles

- None detected.

## Communities (56 total, 15 thin omitted)

### Community 0 - "cn"

Cohesion: 0.09
Nodes (34): class-variance-authority, clsx, @phosphor-icons/react, radix-ui, tailwind-merge, IntentDestination, IntentDestinationFields(), Props (+26 more)

### Community 1 - "dependencies"

Cohesion: 0.09
Nodes (22): dependencies, class-variance-authority, clsx, @epoch-protocol/epoch-intents-sdk, @fontsource-variable/jetbrains-mono, @metamask/sdk, @miden-sdk/miden-sdk, @miden-sdk/miden-wallet-adapter-base (+14 more)

### Community 2 - "IntentForm.tsx"

Cohesion: 0.07
Nodes (46): @epoch-protocol/epoch-intents-sdk, viem, wagmi, ExplorerHashCard(), Props, Tone, TONE_STYLES, ToneStyle (+38 more)

### Community 3 - "devDependencies"

Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, husky (+13 more)

### Community 4 - "WithdrawTab.tsx"

Cohesion: 0.10
Nodes (31): react, @tanstack/react-query, App(), IntentFlowStatus, IntentStatus(), Props, RowProps, StatusRow() (+23 more)

### Community 5 - "compilerOptions"

Cohesion: 0.08
Nodes (24): compilerOptions, allowImportingTsExtensions, baseUrl, erasableSyntaxOnly, incremental, jsx, lib, module (+16 more)

### Community 6 - "useMidenWalletAdapter.ts"

Cohesion: 0.11
Nodes (25): @miden-sdk/miden-sdk, @miden-sdk/miden-wallet-adapter-base, @miden-sdk/miden-wallet-adapter-react, @miden-sdk/react, sonner, IntentForm(), DEFAULT_MIDEN_NETWORK, MidenNetwork (+17 more)

### Community 7 - "What You Must Do When Invoked"

Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 8 - "components.json"

Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 9 - "What You Must Do When Invoked"

Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 10 - "package.json"

Cohesion: 0.05
Nodes (40): name, private, scripts, build, dev, doctor, format, format:check (+32 more)

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

Cohesion: 0.22
Nodes (8): Key Files, Miden ⇄ EVM Epoch Integration Example, Notes, Run Locally, Stack, Supported testnet chains, Test Funds, Wallets

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

### Community 54 - "WithdrawForm.tsx"

Cohesion: 0.12
Nodes (25): WITHDRAW_DEPOSIT_TOAST_ID, WITHDRAW_SETTLE_TOAST_ID, CUSTOM_TOKEN_DEFAULT_DECIMALS, TOKEN_CUSTOM, WITHDRAW_TOKENS, Props, WithdrawTokenFields(), WithdrawForm() (+17 more)

### Community 55 - "main.tsx"

Cohesion: 0.24
Nodes (6): @rainbow-me/rainbowkit, MidenNetworkApp(), chains, config, queryClient, rkTheme

## Knowledge Gaps

- **347 isolated node(s):** `semi`, `singleQuote`, `trailingComma`, `printWidth`, `tabWidth` (+342 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 397 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `WithdrawTab.tsx` to `cn`, `IntentForm.tsx`, `useMidenWalletAdapter.ts`, `package.json`, `WithdrawForm.tsx`, `main.tsx`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **What connects `semi`, `singleQuote`, `trailingComma` to the rest of the system?**
  _347 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.08668076109936575 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `IntentForm.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07481005260081823 - nodes in this community are weakly interconnected._
