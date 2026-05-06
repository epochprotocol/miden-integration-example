import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [react(), wasm(), topLevelAwait()],
  worker: {
    plugins: () => [wasm(), topLevelAwait()],
    format: 'es',
  },
  optimizeDeps: {
    exclude: ['@miden-sdk/miden-sdk'],
  },
  build: {
    target: 'esnext',
  },
  // Do not set COOP/COEP on the dev document. Cross-origin isolation can make fetches to the
  // Miden note transport (`https://transport.miden.io`, gRPC-Web) appear without a readable
  // `Content-Type`, which surfaces as: MissingContentTypeHeader / "failed to sync state".
  // Opt back in only if you need crossOriginIsolation for something else (e.g. threaded WASM):
  // server: { headers: { 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'credentialless' } } },
})
