import "server-only";
import { cache } from "react";
import { prisma } from "./db";
import {
  PERMISSIONS,
  RANK_ORDER,
  permissionsForRank,
  type Rank,
  type Permission,
} from "./rbac";

/**
 * DB-backed role → permission overrides.
 *
 * The code owns the baseline (RANK_ADDITIONS in rbac.ts). This module layers the
 * Director's per-rank adjustments on top and caches them process-wide for a
 * short TTL so `can()` stays synchronous and cheap.
 */

type RankOverride = { add: Set<string>; remove: Set<string> };
type OverrideMap = Map<Rank, RankOverride>;

let cached: { at: number; map: OverrideMap } | null = null;
const TTL_MS = 20_000;

async function fetchOverrides(): Promise<OverrideMap> {
  const rows = await prisma.rolePermissionOverride.findMany();
  const map: OverrideMap = new Map();
  for (const r of RANK_ORDER) map.set(r, { add: new Set(), remove: new Set() });
  for (const row of rows) {
    const entry = map.get(row.rank as Rank);
    if (!entry) continue;
    (row.granted ? entry.add : entry.remove).add(row.permission);
  }
  return map;
}

export async function loadRoleOverrides(): Promise<OverrideMap> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.map;
  const map = await fetchOverrides();
  cached = { at: Date.now(), map };
  return map;
}

/** Force the next read to hit the database (call after a write). */
export function bustRoleOverrides(): void {
  cached = null;
}

/** The actor-shaped override slice for one rank (arrays, ready to attach to Actor). */
export const rankOverridesFor = cache(
  async (rank: Rank): Promise<{ add: string[]; remove: string[] }> => {
    const o = (await loadRoleOverrides()).get(rank);
    return { add: o ? [...o.add] : [], remove: o ? [...o.remove] : [] };
  },
);

/** Effective permission set for a rank: code default ± DB overrides. */
export async function effectivePermissionsForRank(rank: Rank): Promise<Set<Permission>> {
  const o = (await loadRoleOverrides()).get(rank) ?? { add: new Set(), remove: new Set() };
  const set = new Set(permissionsForRank(rank));
  for (const p of o.add) {
    if ((PERMISSIONS as readonly string[]).includes(p)) set.add(p as Permission);
  }
  for (const p of o.remove) set.delete(p as Permission);
  return set;
}

/** Full rank × permission matrix for the /agent/roles editor. */
export async function roleMatrix() {
  const ov = await loadRoleOverrides();
  return RANK_ORDER.map((rank) => {
    const base = permissionsForRank(rank);
    const o = ov.get(rank)!;
    return {
      rank,
      permissions: (PERMISSIONS as readonly Permission[]).map((permission) => {
        const isDefault = base.has(permission);
        const granted = o.add.has(permission)
          ? true
          : o.remove.has(permission)
            ? false
            : isDefault;
        return { permission, granted, isDefault, overridden: granted !== isDefault };
      }),
    };
  });
}
