import { test } from "node:test";
import assert from "node:assert/strict";
import {
  type Actor,
  type Rank,
  PERMISSIONS,
  RANK_ORDER,
  rankLevel,
  rankAtLeast,
  permissionsForRank,
  effectivePermissions,
  can,
  canAny,
  isPlatformAdmin,
  canViewInvestigation,
  investigationVisibilityFilter,
  canChangeRank,
} from "./rbac";

function agent(rank: Rank, over: Partial<NonNullable<Actor["agent"]>> = {}): Actor {
  return {
    userId: "u",
    name: "Test",
    email: "t@fbi.gov",
    isAdmin: false,
    agent: {
      id: "a1",
      badgeNumber: "FBI-0001",
      rank,
      title: "Agent",
      division: "SA",
      unit: null,
      status: "ACTIVE",
      fieldOfficeId: "off1",
      fieldOfficeName: "Los Santos",
      permissionGrants: [],
      permissionRevokes: [],
      ...over,
    },
  };
}

// --- rank helpers -----------------------------------------------------------

test("rankLevel is monotonic along RANK_ORDER", () => {
  for (let i = 1; i < RANK_ORDER.length; i++) {
    assert.ok(rankLevel(RANK_ORDER[i]!) > rankLevel(RANK_ORDER[i - 1]!));
  }
});

test("rankAtLeast", () => {
  assert.equal(rankAtLeast("SAC", "SSA"), true);
  assert.equal(rankAtLeast("SSA", "SAC"), false);
  assert.equal(rankAtLeast("DIRECTOR", "DIRECTOR"), true);
});

// --- rank → permissions ----------------------------------------------------

test("permissionsForRank is cumulative up the ladder", () => {
  const nat = permissionsForRank("NAT");
  const sa = permissionsForRank("SA");
  for (const p of nat) assert.ok(sa.has(p), `SA should inherit ${p}`);
  assert.ok(sa.size > nat.size);
});

test("NAT cannot create investigations, SA can", () => {
  assert.equal(permissionsForRank("NAT").has("investigation.create"), false);
  assert.equal(permissionsForRank("SA").has("investigation.create"), true);
});

// --- effectivePermissions -------------------------------------------------

test("Director gets every permission, including system.manage", () => {
  const eff = effectivePermissions(agent("DIRECTOR"));
  assert.equal(eff.size, PERMISSIONS.length);
  assert.ok(eff.has("system.manage"));
  assert.ok(eff.has("investigation.delete"));
});

test("a suspended non-admin agent has no permissions", () => {
  const eff = effectivePermissions(agent("SAC", { status: "SUSPENDED" }));
  assert.equal(eff.size, 0);
});

test("per-agent grants add and revokes remove", () => {
  const a = agent("NAT", {
    permissionGrants: ["warrant.approve"],
    permissionRevokes: ["investigation.view"],
  });
  const eff = effectivePermissions(a);
  assert.ok(eff.has("warrant.approve"));
  assert.equal(eff.has("investigation.view"), false);
});

test("rank overrides apply, and per-agent overrides win over them", () => {
  const base = agent("SA");
  base.rankOverrides = { add: ["audit.view"], remove: ["investigation.create"] };
  let eff = effectivePermissions(base);
  assert.ok(eff.has("audit.view"));
  assert.equal(eff.has("investigation.create"), false);

  // per-agent grant re-adds what the rank override removed
  base.agent!.permissionGrants = ["investigation.create"];
  eff = effectivePermissions(base);
  assert.ok(eff.has("investigation.create"));
});

test("platform admin flag grants the admin permission set", () => {
  const a: Actor = { ...agent("NAT"), isAdmin: true };
  assert.ok(can(a, "system.manage"));
  assert.equal(isPlatformAdmin(a), true);
});

test("can / canAny", () => {
  const a = agent("SSA");
  assert.equal(can(a, "investigation.close"), true);
  assert.equal(can(null, "investigation.view"), false);
  assert.equal(canAny(a, ["system.manage", "investigation.close"]), true);
  assert.equal(canAny(a, ["system.manage"]), false);
});

// --- canViewInvestigation ------------------------------------------------

const baseInv = {
  id: "i1",
  classification: "UNCLASSIFIED",
  leadAgentId: null as string | null,
  fieldOfficeId: "off1" as string | null,
  isPublic: false,
  assignedAgentIds: [] as string[],
};

test("public investigations are visible to anyone, even anonymous", () => {
  assert.equal(canViewInvestigation(null, { ...baseInv, isPublic: true }), true);
});

test("anonymous cannot see a non-public investigation", () => {
  assert.equal(canViewInvestigation(null, baseInv), false);
});

test("the lead agent sees their own case; an unrelated NAT does not", () => {
  const lead = agent("NAT", { id: "lead1" });
  assert.equal(canViewInvestigation(lead, { ...baseInv, leadAgentId: "lead1" }), true);
  assert.equal(canViewInvestigation(agent("NAT", { id: "other" }), baseInv), false);
});

test("classification gates by rank even for the assigned agent", () => {
  const sa = agent("SA", { id: "x" });
  const inv = { ...baseInv, classification: "SECRET", assignedAgentIds: ["x"] };
  assert.equal(canViewInvestigation(sa, inv), false); // SECRET needs SSA
  const ssa = agent("SSA", { id: "x" });
  assert.equal(canViewInvestigation(ssa, inv), true);
});

test("view.all is office-scoped below AD and unscoped at AD+", () => {
  const sacHome = agent("SAC", { id: "s", fieldOfficeId: "off1" });
  const sacAway = agent("SAC", { id: "s", fieldOfficeId: "off2" });
  assert.equal(canViewInvestigation(sacHome, { ...baseInv, fieldOfficeId: "off1" }), true);
  assert.equal(canViewInvestigation(sacAway, { ...baseInv, fieldOfficeId: "off1" }), false);

  const ad = agent("AD", { id: "d", fieldOfficeId: "off2" });
  assert.equal(canViewInvestigation(ad, { ...baseInv, fieldOfficeId: "off1" }), true);
});

// --- investigationVisibilityFilter -------------------------------------

test("visibility filter always excludes the trash", () => {
  const anon = investigationVisibilityFilter(null) as Record<string, unknown>;
  assert.equal(anon.deletedAt, null);
  assert.equal(anon.isPublic, true);

  const dd = investigationVisibilityFilter(agent("DD")) as Record<string, unknown>;
  assert.equal(dd.deletedAt, null);
  assert.equal("OR" in dd, false); // DD+ sees everything (non-deleted)

  const sa = investigationVisibilityFilter(agent("SA")) as Record<string, unknown>;
  assert.equal(sa.deletedAt, null);
  assert.ok(Array.isArray(sa.OR));
});

// --- canChangeRank -----------------------------------------------------

test("Director can set any rank; others only strictly below their own", () => {
  assert.equal(canChangeRank(agent("DIRECTOR"), "SAC", "DIRECTOR"), true);

  const sac = agent("SAC");
  assert.equal(canChangeRank(sac, "SA", "SSA"), true); // both below SAC
  assert.equal(canChangeRank(sac, "SA", "SAC"), false); // can't promote to own rank
  assert.equal(canChangeRank(sac, "AD", "SA"), false); // target already above
});
