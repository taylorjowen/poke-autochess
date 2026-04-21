// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Canonical balance constants for Pokémon Auto Chess. Single source of truth —
 * do not duplicate these values elsewhere. Changes need a justification in the
 * commit message. See CLAUDE.md § "Canonical balance constants".
 */

/**
 * Trainer level per (cost tier, star count). Used by the battle engine when
 * computing stat scaling — a 1★ 3-cost unit battles as a level-30 trainer, a
 * 2★ 3-cost as level-42, and so on.
 *
 * Formula: `Level = (cost × 10) + ((stars − 1) × 12)`.
 *
 * Why a custom table and not Pokémon's native 1–100 scaling: PokeRogue's
 * roguelike curve multiplies damage ~8× between early and late game, which
 * would collapse the Auto Chess economy (a single 3★ 1-cost would dominate
 * 1★ 5-cost opponents). 12 levels per star step keeps star-ups meaningful
 * but bounded.
 */
export const LEVEL_TABLE = {
  1: { 1: 10, 2: 22, 3: 34 },
  2: { 1: 20, 2: 32, 3: 44 },
  3: { 1: 30, 2: 42, 3: 54 },
  4: { 1: 40, 2: 52, 3: 64 },
  5: { 1: 50, 2: 62, 3: 74 },
} as const;

/**
 * Cost tier assignment by Base Stat Total. This is a starting point — expect
 * hand-tuning once we can playtest. Legendaries and mythicals default to
 * cost 5 regardless of BST.
 *
 * A tier's `min` is inclusive and `max` is inclusive. Cost 1 has no `min`
 * (any BST below 300); cost 5 has no `max` (any BST above 550, plus all
 * legendaries / mythicals).
 */
export const COST_TIER_BY_BST = {
  1: { max: 299 },
  2: { min: 300, max: 400 },
  3: { min: 401, max: 480 },
  4: { min: 481, max: 550 },
  5: { min: 551 },
} as const;

/**
 * TFT-style shared-pool sizing: how many copies of each Pokémon at each cost
 * tier exist in the lobby-wide shop pool. More copies at low cost ⇒ easier
 * to 3★, fewer at high cost ⇒ 3★ late-game carries are rare. Tune per
 * actual Pokémon-per-tier count during playtesting.
 */
export const POOL_COPIES_PER_TIER = {
  1: 22,
  2: 20,
  3: 17,
  4: 10,
  5: 9,
} as const;

/**
 * Number of identical copies needed to star up: 3 copies = 1★→2★, so 9
 * copies = 1★→3★ (3 × 3).
 */
export const COPIES_TO_STAR_UP = 3;

export type CostTier = keyof typeof LEVEL_TABLE;
export type Star = 1 | 2 | 3;
