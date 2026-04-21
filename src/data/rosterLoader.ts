// SPDX-License-Identifier: AGPL-3.0-only

import { POOL_COPIES_PER_TIER } from "@game/data/constants";
import type {
  CostTier,
  Move,
  MoveCategory,
  PokemonType,
  PoolEntry,
  RosterFile,
  StarTier,
  StarTierData,
} from "./roster.schema";

/**
 * Swap rosters by changing this filename (e.g. `gen2.json`). File must live
 * under `./rosters/` next to this module. Vite bundles every matching JSON via
 * `import.meta.glob`; only the active file is loaded at runtime.
 */
const ACTIVE_ROSTER_JSON = "gen1.json";

const DEFAULT_POOL_SIZES: Record<CostTier, number> = {
  1: POOL_COPIES_PER_TIER[1],
  2: POOL_COPIES_PER_TIER[2],
  3: POOL_COPIES_PER_TIER[3],
  4: POOL_COPIES_PER_TIER[4],
  5: POOL_COPIES_PER_TIER[5],
};

const rosterModules = import.meta.glob<RosterFile>("./rosters/*.json", {
  eager: true,
  import: "default",
});

const ACTIVE_PATH = `./rosters/${ACTIVE_ROSTER_JSON}`;

const rawRoster = rosterModules[ACTIVE_PATH];
if (rawRoster === undefined) {
  const available = Object.keys(rosterModules)
    .map((k) => k.replace(/^\.\/rosters\//, ""))
    .join(", ");
  throw new Error(
    `[roster] Active roster "${ACTIVE_ROSTER_JSON}" not found. ` +
      `Expected key "${ACTIVE_PATH}". Available: ${available || "(none)"}.`,
  );
}

const rosterLabel = `rosters/${ACTIVE_ROSTER_JSON}`;

function prefix(msg: string): string {
  return `[roster:${rosterLabel}] ${msg}`;
}

const POKEMON_TYPES = new Set<PokemonType>([
  "normal",
  "fire",
  "water",
  "grass",
  "electric",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
]);

const MOVE_CATEGORIES = new Set<MoveCategory>(["physical", "special", "status"]);

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function assertMove(path: string, m: unknown): asserts m is Move {
  if (!isRecord(m)) {
    throw new Error(prefix(`${path}: expected move object`));
  }
  if (typeof m.id !== "string" || m.id.length === 0) {
    throw new Error(prefix(`${path}.id: non-empty string required`));
  }
  if (typeof m.name !== "string" || m.name.length === 0) {
    throw new Error(prefix(`${path}.name: non-empty string required`));
  }
  if (typeof m.type !== "string" || !POKEMON_TYPES.has(m.type as PokemonType)) {
    throw new Error(prefix(`${path}.type: invalid PokemonType`));
  }
  if (m.power !== null && typeof m.power !== "number") {
    throw new Error(prefix(`${path}.power: number or null required`));
  }
  if (m.accuracy !== null && typeof m.accuracy !== "number") {
    throw new Error(prefix(`${path}.accuracy: number or null required`));
  }
  if (typeof m.category !== "string" || !MOVE_CATEGORIES.has(m.category as MoveCategory)) {
    throw new Error(prefix(`${path}.category: invalid MoveCategory`));
  }
  if (typeof m.pp !== "number" || !Number.isInteger(m.pp) || m.pp < 1) {
    throw new Error(prefix(`${path}.pp: positive integer required`));
  }
}

function expectedLevel(cost: CostTier, star: StarTier): number {
  return cost * 10 + (star - 1) * 12;
}

function validateRosterFile(data: RosterFile): void {
  if (typeof data.name !== "string") {
    throw new Error(prefix(`root.name: string required`));
  }
  if (typeof data.version !== "string") {
    throw new Error(prefix(`root.version: string required`));
  }
  if (!isRecord(data.poolSizes)) {
    throw new Error(prefix(`root.poolSizes: object required`));
  }
  const costs: CostTier[] = [1, 2, 3, 4, 5];
  for (const c of costs) {
    const v = data.poolSizes[c];
    if (typeof v !== "number" || !Number.isInteger(v)) {
      throw new Error(prefix(`root.poolSizes[${String(c)}]: integer required`));
    }
    if (v !== DEFAULT_POOL_SIZES[c]) {
      throw new Error(
        prefix(
          `root.poolSizes[${String(c)}]: expected ${String(DEFAULT_POOL_SIZES[c])} ` +
            `(canonical shop pool), got ${String(v)}`,
        ),
      );
    }
  }
  if (!Array.isArray(data.pokemon)) {
    throw new Error(prefix(`root.pokemon: array required`));
  }

  const seenIds = new Set<string>();

  for (let i = 0; i < data.pokemon.length; i++) {
    const base = `pokemon[${String(i)}]`;
    const entry = data.pokemon[i];
    if (!isRecord(entry as unknown)) {
      throw new Error(prefix(`${base}: expected object`));
    }
    const e = entry as PoolEntry;

    if (typeof e.id !== "string" || e.id.length === 0) {
      throw new Error(prefix(`${base}.id: non-empty string required`));
    }
    if (seenIds.has(e.id)) {
      throw new Error(prefix(`${base}.id: duplicate pool entry id "${e.id}"`));
    }
    seenIds.add(e.id);

    if (!costs.includes(e.cost)) {
      throw new Error(prefix(`${base}.cost: CostTier 1–5 required, got ${String(e.cost)}`));
    }

    if (typeof e.poolSize !== "number" || !Number.isInteger(e.poolSize)) {
      throw new Error(prefix(`${base}.poolSize: integer required`));
    }
    if (e.poolSize !== data.poolSizes[e.cost]) {
      throw new Error(
        prefix(
          `${base}.poolSize: must equal poolSizes[cost] (${String(data.poolSizes[e.cost])}), ` +
            `got ${String(e.poolSize)}`,
        ),
      );
    }

    if (!Array.isArray(e.tiers)) {
      throw new Error(prefix(`${base}.tiers: array required`));
    }
    if (e.tiers.length !== 3) {
      throw new Error(
        prefix(`${base}.tiers: exactly 3 star tiers required, got ${String(e.tiers.length)}`),
      );
    }

    const stars: StarTier[] = [1, 2, 3];
    for (let s = 0; s < 3; s++) {
      const tPath = `${base}.tiers[${String(s)}]`;
      const tier = e.tiers[s];
      if (!isRecord(tier as unknown)) {
        throw new Error(prefix(`${tPath}: expected object`));
      }
      const td = tier as StarTierData;
      const expectStar = stars[s];
      if (td.star !== expectStar) {
        throw new Error(
          prefix(`${tPath}.star: expected ${String(expectStar)}, got ${String(td.star)}`),
        );
      }
      const wantLevel = expectedLevel(e.cost, expectStar);
      if (td.level !== wantLevel) {
        throw new Error(
          prefix(
            `${tPath}.level: expected ${String(wantLevel)} for cost ${String(e.cost)} ` +
              `${String(expectStar)}★ (formula cost×10 + (star−1)×12), got ${String(td.level)}`,
          ),
        );
      }
      if (typeof td.speciesId !== "string" || td.speciesId.length === 0) {
        throw new Error(prefix(`${tPath}.speciesId: non-empty string required`));
      }
      if (typeof td.displayName !== "string" || td.displayName.length === 0) {
        throw new Error(prefix(`${tPath}.displayName: non-empty string required`));
      }
      if (!Array.isArray(td.moves)) {
        throw new Error(prefix(`${tPath}.moves: array required`));
      }
      if (td.moves.length < 3 || td.moves.length > 4) {
        throw new Error(
          prefix(
            `${tPath}.moves: each star tier needs 3–4 moves, got ${String(td.moves.length)}`,
          ),
        );
      }
      for (let mi = 0; mi < td.moves.length; mi++) {
        assertMove(`${tPath}.moves[${String(mi)}]`, td.moves[mi]);
      }
    }
  }
}

validateRosterFile(rawRoster);

/** Validated Kanto (or other) shop pool — source of truth for draft/battle data. */
export const ROSTER: PoolEntry[] = rawRoster.pokemon;

/** Shared pool copy counts per cost tier (matches roster file after validation). */
export const POOL_SIZES: Record<CostTier, number> = rawRoster.poolSizes;

export type { PoolEntry, RosterFile, StarTierData, Move } from "./roster.schema";
