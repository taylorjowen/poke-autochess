<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# Design notes

A living doc. Each section starts as a TODO; future sessions fill in the decisions and link to the code that implements them.

## Game flow

How a match proceeds: lobby formation → draft round → battle round → repeat → eliminations → winner.

- TODO: Round structure (rounds per stage, when carousels happen, when PvE rounds slot in)
- TODO: Elimination rules (HP per player, damage formula per loss)
- TODO: Match length target (TFT averages 30–45 min — what feels right for a P2P fan game?)

## Economy

Gold, interest, win/loss streaks, refresh cost, level-up cost, sell value.

- TODO: Per-round gold income
- TODO: Interest brackets (TFT: 1g per 10g held, capped at 5)
- TODO: Win/loss streak bonuses
- TODO: Refresh cost (TFT: 2g)
- TODO: XP/level-up costs (relate to `LEVEL_TABLE` in `src/game/data/constants.ts`)
- TODO: Sell value (full refund vs. partial; how does combining affect refund?)

## Synergies

Trait/synergy engine. The most game-defining open question.

- TODO: Direct type→trait (Fire/Water/Grass) vs. abstracted groupings (Aggressor / Tank / Support)?
- TODO: Synergy thresholds (TFT-style 2/4/6 breakpoints?)
- TODO: Are abilities a separate axis from types? (e.g., a Fire Pokémon with Levitate counts as Flying for synergies?)
- TODO: Mega evolutions / regional forms — separate units in the pool, or upgrades?

## Networking

PeerJS over WebRTC, host-peer authoritative. Cloudflare Worker handles signaling only.

- TODO: Host election protocol on lobby formation
- TODO: Host migration on disconnect (if at all — fall back to "host left, lobby ends"?)
- TODO: Anti-cheat posture (we are a fan game, but the host can technically rig their own RNG; do we care?)
- TODO: Round pairing algorithm (TFT pairs to balance HP and avoid repeat opponents)
- TODO: State sync protocol (delta vs. full snapshots between rounds)
- TODO: Spectator mode for eliminated players

## Open questions parked from initial setup

- **Synergy/trait system:** direct type-to-trait or abstracted groupings?
- **Board positioning:** does it matter for battle resolution, or purely team comp?
- **Items:** Pokémon held items (Choice Band, Leftovers) or Auto Chess–style item combining?
- **Battle format:** singles 1v1 sequential, or doubles 2v2?
- **Round structure:** TFT runs 9–10 units max — what's right for us?
