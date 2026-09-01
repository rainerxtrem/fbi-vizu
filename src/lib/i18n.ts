// Central French dictionary for the whole app.
//
// All enum → label maps live in `constants.ts`. This module re-exports them
// under one import and adds helpers so option lists (`<select>`) and badge
// labels never drift from each other or get re-hardcoded in a component.

export * from "./constants";

import type { Rank } from "./rbac";
import { RANK_LABELS } from "./rbac";

/** `{ A: "Alpha", B: "Beta" }` → `[["A","Alpha"],["B","Beta"]]` for `<option>` lists. */
export function options<T extends Record<string, string>>(map: T): [keyof T & string, string][] {
  return Object.entries(map) as [keyof T & string, string][];
}

/** `{ A: { label, tone } }` → `[["A","label"]]`. */
export function labelOptions<T extends Record<string, { label: string }>>(
  map: T,
): [keyof T & string, string][] {
  return Object.entries(map).map(([k, v]) => [k, v.label]) as [keyof T & string, string][];
}

export function rankLabel(rank: string): string {
  return RANK_LABELS[rank as Rank] ?? rank;
}
