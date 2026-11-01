# Graph Report - miden-integration-example (2026-10-23)

## Corpus Check

- 111 files · ~59,510 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary

- 673 nodes · 956 edges · 61 communities (45 shown, 16 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness

- Built from commit: `1a5161fd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)

- cn
- dependencies
- IntentForm.tsx
- devDependencies
- WithdrawTab.tsx
- compilerOptions
- config/miden.ts
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
- useMidenP2IDNoteFactory.ts
- vite.config.ts
- App.tsx

## God Nodes (most connected - your core abstractions)

1. `compilerOptions` - 23 edges
2. `cn()` - 18 edges
3. `IntentForm()` - 12 edges
4. `requirePublicMidenAccountId()` - 12 edges
5. `What You Must Do When Invoked` - 12 edges
6. `What You Must Do When Invoked` - 12 edges
7. `What You Must Do When Invoked` - 12 edges
8. `What You Must Do When Invoked` - 12 edges
9. `scripts` - 11 edges
10. `getMidenNetworkConfig()` - 10 edges

## Surprising Connections (you probably didn't know these)

- `IntentForm()` --calls--> `isSupportedEvmChain()` [EXTRACTED]
  src/components/crosschain/IntentForm.tsx → src/constants/chains.ts
- `IntentForm()` --calls--> `useIntentSettlementView()` [EXTRACTED]
  src/components/crosschain/IntentForm.tsx → src/hooks/useIntentSettlementView.ts
- `IntentForm()` --calls--> `useMidenNetwork()` [EXTRACTED]
  src/components/crosschain/IntentForm.tsx → src/hooks/useMidenNetwork.ts
- `IntentForm()` --calls--> `useMidenP2IDNoteFactory()` [EXTRACTED]
  src/components/crosschain/IntentForm.tsx → src/hooks/useMidenP2IDNoteFactory.ts
- `IntentForm()` --calls--> `midenscanNoteUrl()` [EXTRACTED]
  src/components/crosschain/IntentForm.tsx → src/lib/explorers.ts

## Import Cycles

- None detected.

## Communities (61 total, 16 thin omitted)

### Community 0 - "cn"

Cohesion: 0.09
Nodes (34): IntentDestination, IntentDestinationFields(), Props, CUSTOM_TOKEN_DEFAULT_DECIMALS, TOKEN_CUSTOM, WITHDRAW_TOKENS, Props, WithdrawAccountFields() (+26 more)

### Community 1 - "dependencies"

Cohesion: 0.04
Nodes (45): class-variance-authority, clsx, @epoch-protocol/epoch-commons-sdk, @epoch-protocol/epoch-intents-sdk, @fontsource-variable/jetbrains-mono, @metamask/sdk, @miden-sdk/miden-sdk, @miden-sdk/miden-wallet-adapter-base (+37 more)

### Community 2 - "IntentForm.tsx"

Cohesion: 0.09
Nodes (42): ExplorerHashCard(), Props, Tone, TONE_STYLES, ToneStyle, formatRequiredDeposit(), IntentQuoteSummary(), Props (+34 more)

### Community 3 - "devDependencies"

Cohesion: 0.05
Nodes (43): autoprefixer, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, husky, lint-staged (+35 more)

### Community 4 - "WithdrawTab.tsx"

Cohesion: 0.09
Nodes (39): IntentFlowStatus, IntentStatus(), Props, RowProps, StatusRow(), WITHDRAW_DEPOSIT_TOAST_ID, WITHDRAW_SETTLE_TOAST_ID, WithdrawForm() (+31 more)

### Community 5 - "compilerOptions"

Cohesion: 0.06
Nodes (31): DOM, DOM.Iterable, ES2022, node, src, vite/client, vite.config.ts, compilerOptions (+23 more)

### Community 6 - "config/miden.ts"

Cohesion: 0.09
Nodes (26): IntentForm(), MidenNetworkApp(), COMMONS_MIDEN_MAINNET, DEPLOYMENT_PROFILE, DeploymentProfile, endpoint(), getDeploymentProfile(), MIDEN_ASSETS (+18 more)

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

Cohesion: 0.12
Nodes (15): name, private, scripts, build, dev, doctor, format, format:check (+7 more)

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

### Community 54 - "useMidenP2IDNoteFactory.ts"

Cohesion: 0.24
Nodes (11): Options, toAccountId(), useMidenP2IDNoteFactory(), MultisigAuthArgs, randomMultisigSalt(), withMultisigAuthArgs(), CachedMidenNote, matchesQuote() (+3 more)

### Community 59 - "App.tsx"

Cohesion: 0.14
Nodes (15): App(), Header(), Props, TabNav(), tabs, Button, ButtonProps, buttonVariants (+7 more)

## Knowledge Gaps

- **344 isolated node(s):** `semi`, `singleQuote`, `trailingComma`, `printWidth`, `tabWidth` (+339 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `scripts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `scripts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `App.tsx`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **What connects `semi`, `singleQuote`, `trailingComma` to the rest of the system?**
  _344 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.0898989898989899 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._
- **Should `IntentForm.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08506493506493507 - nodes in this community are weakly interconnected._
