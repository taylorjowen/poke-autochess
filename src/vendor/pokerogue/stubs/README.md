<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# Vendor stubs

These directories shim PokeRogue modules we intentionally did **not** vendor (save system, account, settings UI, biomes, mystery encounters, online API, etc.). Path aliases in `tsconfig.json` and `vite.config.ts` route the upstream's `#system/*`, `#api/*`, `#ui/*`, `#trainers/*`, etc. into the corresponding subdirectory here.

| Stub dir              | Replaces upstream alias            | Purpose                                                     |
| --------------------- | ---------------------------------- | ----------------------------------------------------------- |
| `api/`                | `#api/*`                           | Online services (daily runs, leaderboards, login)           |
| `global-scene/`       | reserved for `#app` global-scene shim | Future: minimal facade over the god-object `globalScene`  |
| `init/`               | `#init/*`                          | Boot init flow (replaced by our `BootScene`)                |
| `inputs/`             | `#inputs/*`                        | Gamepad/keyboard config (replaced by Phaser's input layer)  |
| `mystery-encounters/` | `#mystery-encounters/*`            | Mystery encounter system — out of scope for Auto Chess      |
| `plugins/`            | `#plugins/*`                       | Vite plugin glue we don't run                               |
| `system/`             | `#system/*`                        | Save data, settings, achv, voucher, game-data               |
| `trainers/`           | `#trainers/*`                      | Roguelike trainer configs — Auto Chess uses player teams    |
| `ui/`                 | `#ui/*`                            | Upstream's full Phaser UI layer — replaced by ours          |

**Conventions for stubs:**

1. Re-export only the symbols that vendored code imports. Don't speculate.
2. For values, throw a clear error referencing this directory and `VENDORING.md`. Auto Chess paths should never call into a stub at runtime; if they do, that's a missing integration we want loud.
3. For types, prefer minimal `interface Foo {}` or `type Foo = unknown` over copying upstream's full definition — less drift on syncs.
4. Each new stub file gets a top-of-file comment: what it replaces, what symbols it exposes, why we don't have the real thing.
5. Log every new stub file in `/VENDORING.md` § "Local stubs".

These stubs are intentionally empty in this initial setup pass. They'll grow as `src/game/*` starts importing battle-engine entry points and discovers what surface area is actually needed.
