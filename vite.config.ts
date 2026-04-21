// SPDX-License-Identifier: AGPL-3.0-only
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const vendor = (p: string) => resolve(__dirname, 'src/vendor/pokerogue', p);

export default defineConfig({
  server: {
    port: 5173,
    host: '127.0.0.1',
  },
  preview: {
    port: 5173,
  },
  resolve: {
    alias: {
      '@game': resolve(__dirname, 'src/game'),
      '@vendor': resolve(__dirname, 'src/vendor'),
      '@shared': resolve(__dirname, 'src/shared'),

      // PokeRogue internal aliases. Keep in sync with tsconfig.json paths.
      '#app': vendor('stubs/global-scene'),
      '#api': vendor('stubs/api'),
      '#system': vendor('stubs/system'),
      '#enums': vendor('enums'),
      '#data': vendor('data'),
      '#field': vendor('field'),
      '#moves': vendor('data/moves'),
      '#abilities': vendor('data/abilities'),
      '#balance': vendor('data/balance'),
      '#types': vendor('@types'),
      '#ui': vendor('stubs/ui'),
      '#phases': vendor('phases'),
      '#sprites': vendor('sprites'),
      '#mystery-encounters': vendor('stubs/mystery-encounters'),
      '#plugins': vendor('plugins'),
    },
  },
  // Phaser ships ESM and CJS bundles. Force ESM resolution and let Vite
  // tree-shake. Asset handling stays default (public/ for static, import for
  // hashed) — game asset loading is a later task; see VENDORING.md.
  optimizeDeps: {
    include: ['phaser', 'peerjs'],
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
});
