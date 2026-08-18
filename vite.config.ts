import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [react(), wasm(), topLevelAwait()],
  worker: {
    plugins: () => [wasm(), topLevelAwait()],
    format: "es",
  },
  optimizeDeps: {
    exclude: ["@miden-sdk/miden-sdk"],
    // Force Vite to pre-bundle the linked local SDK. Linked (file:) deps are not
    // optimized by default, so its CommonJS transitive deps (e.g. lodash) would
    // lack an ESM default export and fail at runtime. Pre-bundling interops them.
    // After rebuilding the SDK, restart the dev server with `--force` to refresh.
    include: ["@epoch-protocol/epoch-intents-sdk"],
  },
  build: {
    target: "esnext",
  },
});
