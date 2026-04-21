# Pokémon Auto Chess

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

A free, open-source browser fan game that combines Pokémon battles with [TFT](https://teamfighttactics.leagueoflegends.com/)-style Auto Chess mechanics. Multiplayer is peer-to-peer over WebRTC; one lobby member's browser hosts the authoritative game state, with a tiny Cloudflare Worker handling only WebRTC signaling.

## Quick start

```bash
npm install
npm run dev
```

Then open http://127.0.0.1:5173.

## Scripts

| Command             | What it does                          |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Start the Vite dev server on :5173    |
| `npm run build`     | Production build to `dist/`           |
| `npm run preview`   | Serve the built bundle                |
| `npm run typecheck` | `tsc --noEmit` strict typecheck       |
| `npm run lint`      | ESLint over `src/` and config         |
| `npm run format`    | Prettier write                        |

## Project layout

```
src/game/      Our game code
src/vendor/    PokeRogue's battle engine + data layer (vendored, AGPL-3.0)
src/shared/    Types shared between game and vendor adapters
server/        Cloudflare Worker for WebRTC signaling
docs/          Design docs
```

See [`CLAUDE.md`](./CLAUDE.md) for the full architectural overview and [`VENDORING.md`](./VENDORING.md) for the PokeRogue sync protocol.

## Status

Pre-alpha. This is a non-commercial fan project. Pokémon and all related names, characters, and assets are property of Nintendo / Game Freak / The Pokémon Company. No affiliation, no commercial use.

## License

[AGPL-3.0-only](./LICENSE). Because we vendor [PokeRogue](https://github.com/pagefaultgames/pokerogue) (also AGPL-3.0-only) into the same binary, the combined work is also AGPL-3.0-only.
