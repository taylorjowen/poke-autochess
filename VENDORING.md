# VENDORING.md

How we keep `src/vendor/pokerogue/` in sync with upstream [PokeRogue](https://github.com/pagefaultgames/pokerogue).

## Last-synced upstream

| Field          | Value                                      |
| -------------- | ------------------------------------------ |
| Repo           | https://github.com/pagefaultgames/pokerogue |
| Commit         | `f52a566f5215e20a0b29ec0202ea4c96dc2b87c5` |
| Commit date    | 2026-04-18                                 |
| Sync date      | 2026-04-21                                 |
| Synced by      | Initial setup session                      |

## Vendored paths

This table is the inventory of what we pulled from upstream. Local path is relative to `src/vendor/pokerogue/`. "Local mods" should stay empty; every entry there is a deviation we owe upstream-sync attention.

| Upstream path           | Local path           | Local mods |
| ----------------------- | -------------------- | ---------- |
| `src/data/`             | `data/`              | (none)     |
| `src/field/`            | `field/`             | (none)     |
| `src/battle.ts`         | `battle.ts`          | (none)     |
| `src/battle-scene.ts`   | `battle-scene.ts`    | (none)     |
| `src/phases/`           | `phases/`            | (none)     |
| `src/enums/`            | `enums/`             | (none)     |
| `src/@types/`           | `@types/`            | (none)     |
| `src/utils/`            | `utils/`             | (none)     |
| `src/constants/`        | `constants/`         | (none)     |
| `src/constants.ts`      | `constants.ts`       | (none)     |
| `src/modifier/`         | `modifier/`          | (none)     |
| `src/sprites/`          | `sprites/`           | (none)     |
| `src/animations.ts`     | `animations.ts`      | (none)     |
| `src/messages.ts`       | `messages.ts`        | (none)     |
| `src/scene-base.ts`     | `scene-base.ts`      | (none)     |
| `src/global-vars/`      | `global-vars/`       | (none)     |
| `src/events/`           | `events/`            | (none)     |
| `src/queues/`           | `queues/`            | (none)     |
| `src/dynamic-queue-manager.ts` | `dynamic-queue-manager.ts` | (none) |
| `src/turn-command-manager.ts`  | `turn-command-manager.ts`  | (none) |
| `src/phase.ts`                 | `phase.ts`                 | (none) |
| `src/phase-manager.ts`         | `phase-manager.ts`         | (none) |
| `src/phase-tree.ts`            | `phase-tree.ts`            | (none) |
| `src/game-mode.ts`             | `game-mode.ts`             | (none) |
| `src/overrides.ts`             | `overrides.ts`             | (none) |
| `src/global-event-manager.ts`  | `global-event-manager.ts`  | (none) |
| `src/timed-event-manager.ts`   | `timed-event-manager.ts`   | (none) |
| `src/extensions.ts`            | `extensions.ts`            | (none) |
| `src/polyfills.ts`             | `polyfills.ts`             | (none) |
| `src/global-scene.ts`          | `global-scene.ts`          | (none) |
| `LICENSE`, `LICENSES/`, `REUSE.toml` | `LICENSE`, `LICENSES/`, `REUSE.toml` | (none) |

## Intentionally NOT vendored

These are roguelike-specific or out-of-scope for Auto Chess and stay out of the tree:

- `src/system/game-data.ts` and the wider save/load system
- `src/account.ts` and any login/account flow
- Anything under `src/plugins/api/` or referencing `pokerogue-api`
- `src/ui/` (settings UI, menus, starter select, pokedex UI, achievements UI, egg system UI)
- Mystery encounter system (`src/data/mystery-encounters/` is partially shimmed via stubs)
- Biomes, trainers, daily runs, achievements, egg system, starter select
- `src/loading-scene.ts`, `src/init/` (PokeRogue boot flow — we use our own)
- `src/ai/` (PokeRogue's enemy trainer AI — Auto Chess uses our own commander AI)
- `src/inputs-controller.ts`, `src/touch-controls.ts`, `src/ui-inputs.ts`
- `src/configs/`, `src/locales/`
- `src/main.ts`, `src/global-manifest.ts`
- `src/dev-function.ts`, `src/pipelines/`
- `src/test/` (upstream's vitest suite)

## Local stubs

Stubs replace un-vendored modules so vendored files can import them. They live in `src/vendor/pokerogue/stubs/` and are wired in via path aliases in `tsconfig.json` and `vite.config.ts`. The principle: minimum surface area to satisfy imports, throw on calls we don't intend to support yet.

| Stub                          | Replaces                | Why                                                                          |
| ----------------------------- | ----------------------- | ---------------------------------------------------------------------------- |
| `stubs/global-scene/`         | reserved for `#app` shim | Reserved. The vendored `global-scene.ts` is entangled with UI/init we don't have; when game code starts touching battle entry points, this is where the minimal facade lives. |
| `stubs/system/`               | `#system/*`             | Save system, settings, account — none of which Auto Chess needs.            |
| `stubs/api/`                  | `#api/*`                | Online services, daily runs, leaderboards — not used.                       |
| `stubs/ui/`                   | `#ui/*`                 | UI handlers and menus — replaced by our own Phaser UI.                      |
| `stubs/mystery-encounters/`   | `#mystery-encounters/*` | Out of scope for Auto Chess.                                                |
| `stubs/init/`                 | `#init/*`               | PokeRogue's boot init — replaced by our `BootScene`.                        |
| `stubs/inputs/`               | `#inputs/*`             | Gamepad/keyboard config — replaced by Phaser's input layer.                 |
| `stubs/trainers/`             | `#trainers/*`           | Roguelike trainer configs — Auto Chess has no fixed-team enemy trainers.    |
| `stubs/plugins/`              | `#plugins/*`            | Vite plugin glue we don't run.                                              |

All stub directories are currently empty (only a `.gitkeep`). They'll grow organically as `src/game/*` starts importing battle-engine entry points and discovers what surface area the engine actually touches in those un-vendored modules. Every stub file added must:

1. Re-export only the symbols actually imported by vendored code (no speculation).
2. Throw a clear error from any value/function the game shouldn't call.
3. Carry a header comment: what it shims, what symbols it exposes, why we don't have the real thing.
4. Get a row added to the table above.

## Typechecking strategy

Vendored code is **excluded** from `npm run typecheck`. Two reasons:

1. PokeRogue's upstream `tsconfig.json` runs with `strict: false` and `noImplicitAny: false`. Our root `tsconfig.json` enforces full strict mode, which produces hundreds of false-positive errors against vendored code that's perfectly valid under upstream's config.
2. Many vendored files import from un-vendored modules (`#system/*`, `#ui/*`, etc.). Until our game code begins to use a particular battle entry point, we don't know which stubs are needed. Typechecking the whole vendor tree before that would force us to write dozens of speculative stubs.

Instead:

- `npm run typecheck` — strict typecheck of **our** code (`src/game/`, `src/shared/`, `src/main.ts`). This is what CI gates on.
- `npm run typecheck:vendor` — looser typecheck of vendored code under `tsconfig.vendor.json` (mirroring upstream's settings). This is **expected to fail** until the corresponding stubs land. Useful for spot-checking what a sync introduced; not part of normal CI.

When game code begins importing from `#vendor/pokerogue/...`, that import pulls vendored files into the strict typecheck graph too. Whatever stubs are needed to make that import resolve under strict get added at that point — incrementally, one game-code commit at a time.

## Sync procedure

```bash
# 1. Pull a fresh upstream snapshot.
rm -rf /tmp/pokerogue-upstream
git clone --depth 1 https://github.com/pagefaultgames/pokerogue.git /tmp/pokerogue-upstream

# 2. Record the new HEAD commit and date.
git -C /tmp/pokerogue-upstream rev-parse HEAD
git -C /tmp/pokerogue-upstream log -1 --format='%cI'

# 3. Diff each vendored subtree and review changes.
for path in data field phases enums @types utils constants modifier sprites; do
  echo "=== $path ==="
  diff -r "/tmp/pokerogue-upstream/src/$path" "src/vendor/pokerogue/$path" | head -100
done

# Single-file vendored modules — diff each one:
for f in battle.ts battle-scene.ts constants.ts animations.ts messages.ts \
         scene-base.ts dynamic-queue-manager.ts turn-command-manager.ts \
         phase.ts phase-manager.ts phase-tree.ts game-mode.ts overrides.ts \
         global-event-manager.ts timed-event-manager.ts extensions.ts \
         polyfills.ts global-scene.ts; do
  diff "/tmp/pokerogue-upstream/src/$f" "src/vendor/pokerogue/$f"
done
```

Then, for each non-trivial change:

1. Decide whether to port it (most data/move/ability updates: yes; battle-system rewrites: review carefully; UI/save changes: ignore).
2. Apply the diff manually. Don't `cp` whole subtrees — that destroys the audit trail and can resurrect deleted stubs.
3. If a port requires a change to a stub or to vendored code, add a row to "Local modifications" below or to the stub table above.
4. Bump "Last-synced upstream" at the top of this file.
5. Commit with `vendor: sync to upstream <short-sha>` and list the touched paths in the body.

## Local modifications

> Ground rule: this section should be empty almost all the time. Every row here is technical debt against future syncs — keep it short and document it well.

| File | Lines | Reason | Date |
| ---- | ----- | ------ | ---- |
| (none yet) | | | |

## Known upstream-drift risks

- **Battle system refactors.** The biggest risk. If upstream rearranges `phases/` or rewrites `move-effect-phase.ts`, our integration around it will need rework. Diff `phases/` carefully on every sync.
- **`global-scene.ts` coupling.** PokeRogue's god-object pattern means vendored files reach into `globalScene` for everything from battle field state to RNG to settings. Our stub bridges this; expect to extend the stub when upstream introduces new `globalScene` accessors.
- **Data layer (Pokémon, moves, abilities, evolutions, type charts).** These typically merge cleanly. New species/moves are additive.
- **Enum renumbering.** PokeRogue occasionally renumbers enums; if our save/match data ever serializes enum values, this becomes a migration concern. We currently don't, but flag if that changes.

## Assets

PokeRogue's assets (sprites, audio, animations) live in a separate repo: https://github.com/pagefaultgames/pokerogue-assets. They have their own license and licensing situation per asset (some are CC-BY-NC, some are unrestricted, see that repo's `REUSE.toml`).

We do **not** vendor assets in this initial pass. `public/assets/.gitkeep` reserves the directory; loading and licensing review are a deliberate later task. Until then, the game runs without sprites — Phaser scenes render text/shape placeholders.
