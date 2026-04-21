<!--
SPDX-FileCopyrightText: 2024-2026 Pagefault Games
SPDX-License-Identifier: AGPL-3.0-only

Vendored from PokeRogue (https://github.com/pagefaultgames/pokerogue)

  Last-synced commit: f52a566f5215e20a0b29ec0202ea4c96dc2b87c5
  Last-synced date:   2026-04-18
  Sync date:          2026-04-21

DO NOT modify files in this directory beyond the strict minimum required for
integration. Adapt around vendored code in src/game/* instead. Every exception
must be logged in /VENDORING.md under "Local modifications".

See /VENDORING.md for the full vendor manifest, sync procedure, and stub registry.
-->

# `src/vendor/pokerogue/`

This tree is a snapshot of selected modules from [PokeRogue](https://github.com/pagefaultgames/pokerogue) (AGPL-3.0-only). We use it for the battle engine, field entities, and the data layer (species/moves/abilities/types).

## What's here

- `data/`, `field/`, `phases/`, `enums/`, `@types/`, `utils/`, `constants/`, `modifier/`, `sprites/`, `global-vars/`, `events/`, `queues/`
- Top-level battle modules (`battle.ts`, `battle-scene.ts`, `phase*.ts`, `turn-command-manager.ts`, `dynamic-queue-manager.ts`, `game-mode.ts`, `overrides.ts`, `animations.ts`, `messages.ts`, `scene-base.ts`, `extensions.ts`, `polyfills.ts`, `global-scene.ts`, `global-event-manager.ts`, `timed-event-manager.ts`)
- License metadata (`LICENSE`, `LICENSES/`, `REUSE.toml`, `global.d.ts`)

## What's NOT here

The save system, account/login, settings UI, biomes, trainers, mystery encounters, daily runs, achievements, eggs, starter select, pokedex UI, and the full UI layer were intentionally not vendored. They're roguelike-specific and don't apply to Auto Chess.

## Stubs

`stubs/` contains thin local replacements for un-vendored modules so vendored files can resolve their imports. Path aliases in `tsconfig.json` and `vite.config.ts` route PokeRogue's `#app`, `#system/*`, `#api/*`, `#ui/*`, etc. into the appropriate stub. See `/VENDORING.md` for the full registry.
