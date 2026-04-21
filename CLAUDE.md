# CLAUDE.md

Notes for future Claude Code sessions on this repository. Read this before making changes.

## What this project is

Pokémon Auto Chess is a browser fan game blending Pokémon's battle system with TFT-style Auto Chess: draft from a shared shop, level up units by collecting copies, build trait synergies, and battle other lobby members across rounds. Multiplayer runs P2P over WebRTC (PeerJS); the host peer for each lobby is the authoritative simulator. A tiny Cloudflare Worker brokers SDP/ICE — no game state lives on the server.

## Tech stack

- **Engine:** Phaser 3
- **Language:** TypeScript (strict mode)
- **Build:** Vite 5
- **Package manager:** npm; **Node:** 20+ (see `.nvmrc`)
- **Networking:** PeerJS over WebRTC, host-peer authoritative
- **Signaling:** Cloudflare Worker (`server/signaling/`)
- **Battle engine + data layer:** vendored from [PokeRogue](https://github.com/pagefaultgames/pokerogue) (AGPL-3.0-only)

## Vendor — don't fork

We pull PokeRogue's battle engine, field entities, and data layer into `src/vendor/pokerogue/`. We do **not** fork the upstream repo. The strategy:

- Copy specific subtrees we need; track the last-synced upstream commit in [`VENDORING.md`](./VENDORING.md).
- On future syncs, diff the vendored paths against upstream and port relevant changes manually.
- **Never modify files inside `src/vendor/pokerogue/` beyond the strict minimum required for integration.** Adapt around vendored code in `src/game/` instead.
- Every exception is logged in `VENDORING.md` under "Local modifications," with file path, line range, reason, and date.
- Stubs for things we intentionally didn't vendor (save system, account, biomes, mystery encounters, login) live in `src/vendor/pokerogue/stubs/` and are wired in via path aliases in `tsconfig.json` and `vite.config.ts` — keep those two files in sync.

If a vendored file imports something we said not to vendor, the right move is to extend `stubs/`, not to edit the vendored file.

## Directory conventions

| Path                         | What lives here                                                       |
| ---------------------------- | --------------------------------------------------------------------- |
| `src/game/scenes/`           | Phaser scenes: `Boot`, `Lobby`, `Draft`, `Battle`                     |
| `src/game/shop/`             | Draft phase logic + UI                                                |
| `src/game/economy/`          | Gold, interest, win/loss streaks                                      |
| `src/game/board/`            | Board grid state + positioning                                        |
| `src/game/synergies/`        | Trait/synergy engine                                                  |
| `src/game/ai/`               | Battle commander AI (replaces player input during combat)             |
| `src/game/net/`              | PeerJS wrapper, host-peer protocol, state sync                        |
| `src/game/lobby/`            | Lobby + matchmaking/round pairing                                     |
| `src/game/data/`             | Our overlays: cost tiers, star-tier movesets, synergy defs, constants |
| `src/vendor/pokerogue/`      | Vendored from PokeRogue — minimize edits                              |
| `src/vendor/pokerogue/stubs/` | Local stubs for un-vendored modules                                  |
| `src/shared/`                | Types shared between `src/game/*` and vendor adapters                 |
| `server/signaling/`          | Cloudflare Worker for WebRTC signaling                                |
| `docs/`                      | Design docs (`design.md` etc.)                                        |

Path aliases (mirror in `tsconfig.json` and `vite.config.ts`):

- `@game/*` → `src/game/*`
- `@vendor/*` → `src/vendor/*`
- `@shared/*` → `src/shared/*`
- PokeRogue's internal aliases (`#app/`, `#enums/`, `#data/`, `#field/`, `#system/`, etc.) are preserved pointing into `src/vendor/pokerogue/` so vendored files compile unmodified.

## Commands

```bash
npm run dev        # Vite dev server on http://127.0.0.1:5173
npm run build      # Production build to dist/
npm run preview    # Preview the built bundle
npm run typecheck  # tsc --noEmit (strict)
npm run lint       # ESLint
npm run format     # Prettier write
```

For the signaling worker, see [`server/signaling/README.md`](./server/signaling/README.md).

## Commit conventions

[Conventional Commits.](https://www.conventionalcommits.org/) Allowed types:

- `feat:` — user-visible game features
- `fix:` — bug fix
- `chore:` — build, tooling, config
- `docs:` — documentation only
- `refactor:` — non-behavioral cleanup
- `test:` — tests
- `vendor:` — PokeRogue vendor sync or stub change. Always include the upstream short SHA being synced from in the body.

Atomic commits, one logical change each. Do not bundle vendor syncs with feature work.

## Canonical balance constants

The single source of truth lives in [`src/game/data/constants.ts`](./src/game/data/constants.ts). Do not duplicate these values elsewhere. Changes need a justification in the commit message. Current set:

- `LEVEL_TABLE` — trainer level per (cost, star). Formula: `Level = (cost × 10) + ((stars − 1) × 12)`. Avoids Pokémon's ~8× damage scaling between 1★ and 3★ that would break Auto Chess economy.
- `COST_TIER_BY_BST` — cost tier by Base Stat Total (starting point; hand-tune for balance).
- `POOL_COPIES_PER_TIER` — TFT-style shared pool, copies per cost tier.
- `COPIES_TO_STAR_UP` — `3` (3 copies = 1★→2★, 9 copies = 1★→3★).

## Things to NOT do

- Don't edit vendored files to make TypeScript errors go away — write a stub, log it in `VENDORING.md`.
- Don't introduce game state on the signaling server. Game state lives in the host peer's browser.
- Don't bundle vendored assets into git. Asset loading is a deliberate later task; see `VENDORING.md` § Assets.
- Don't add `// removed because…` comments or backwards-compatibility shims when deleting code. Delete cleanly.
- Don't write WHAT comments. Identifiers should explain themselves; comments are for non-obvious WHY.

## License posture

AGPL-3.0-only. Add an SPDX header to every new source file we author:

```ts
// SPDX-License-Identifier: AGPL-3.0-only
```

PokeRogue files keep their own headers and the upstream `REUSE.toml` we copy alongside them.
