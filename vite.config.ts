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

      // PokeRogue's internal aliases. Keep in sync with tsconfig.json paths.
      '#abilities': vendor('data/abilities'),
      '#api': vendor('stubs/api'),
      '#balance': vendor('data/balance'),
      '#biomes': vendor('data/balance/biomes'),
      '#constants': vendor('constants'),
      '#data': vendor('data'),
      '#enums': vendor('enums'),
      '#events': vendor('events'),
      '#field': vendor('field'),
      '#init': vendor('stubs/init'),
      '#inputs': vendor('stubs/inputs'),
      '#modifiers': vendor('modifier'),
      '#moves': vendor('data/moves'),
      '#mystery-encounters': vendor('stubs/mystery-encounters'),
      '#phases': vendor('phases'),
      '#plugins': vendor('stubs/plugins'),
      '#sprites': vendor('sprites'),
      '#system': vendor('stubs/system'),
      '#trainers': vendor('stubs/trainers'),
      '#types': vendor('@types'),
      '#ui': vendor('stubs/ui'),
      '#utils': vendor('utils'),
      '#app': vendor(''),
    },
  },
  // Phaser ships ESM and CJS bundles. Vite picks ESM and tree-shakes. Asset
  // handling stays default (public/ for static, import for hashed) — game
  // asset loading is a later task; see VENDORING.md § Assets.
  optimizeDeps: {
    include: ['phaser', 'peerjs'],
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
});
