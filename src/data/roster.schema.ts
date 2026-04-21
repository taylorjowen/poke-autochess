// SPDX-License-Identifier: AGPL-3.0-only

export type StarTier = 1 | 2 | 3;
export type CostTier = 1 | 2 | 3 | 4 | 5;
export type MoveCategory = "physical" | "special" | "status";
export type PokemonType =
  | "normal"
  | "fire"
  | "water"
  | "grass"
  | "electric"
  | "ice"
  | "fighting"
  | "poison"
  | "ground"
  | "flying"
  | "psychic"
  | "bug"
  | "rock"
  | "ghost"
  | "dragon"
  | "dark"
  | "steel"
  | "fairy";

export interface Move {
  id: string;
  name: string;
  type: PokemonType;
  power: number | null;
  accuracy: number | null;
  category: MoveCategory;
  pp: number;
}

export interface StarTierData {
  star: StarTier;
  level: number;
  speciesId: string;
  displayName: string;
  moves: Move[];
}

export interface PoolEntry {
  id: string;
  cost: CostTier;
  poolSize: number;
  tiers: [StarTierData, StarTierData, StarTierData];
}

export interface RosterFile {
  name: string;
  version: string;
  poolSizes: Record<CostTier, number>;
  pokemon: PoolEntry[];
}
