// ---------------------------------------------------------------------------
// Role-Based Access Control (RBAC)
//
// All permission checks in this application are performed SERVER-SIDE using
// this module. The frontend never decides access on its own — it only reflects
// the result of server checks.
//
// A user's effective permission set is derived from:
//   1. Platform role (Admin) — technical permissions over the platform
//   2. Agent rank            — institutional/operational permissions
//   3. Per-agent overrides   — explicit grants / revokes managed by an Admin
//
// Data visibility additionally depends on rank + assignment + classification
// (see canViewInvestigation / investigationVisibilityFilter).
// ---------------------------------------------------------------------------

export type Rank =
  | "NAT"
  | "SA"
  | "SSA_SENIOR"
  | "SSA"
  | "ASAC"
  | "SAC"
  | "AD"
  | "AEAD"
  | "EAD"
  | "ADD"
  | "DD"
  | "DIRECTOR";

export const RANK_ORDER: Rank[] = [
  "NAT",
  "SA",
  "SSA_SENIOR",
  "SSA",
  "ASAC",
  "SAC",
  "AD",
  "AEAD",
  "EAD",
  "ADD",
  "DD",
  "DIRECTOR",
];

export const RANK_LABELS: Record<Rank, string> = {
  NAT: "New Agent Trainee",
  SA: "Special Agent",
  SSA_SENIOR: "Senior Special Agent",
  SSA: "Supervisory Special Agent",
  ASAC: "Assistant Special Agent in Charge",
  SAC: "Special Agent in Charge",
  AD: "Assistant Director",
  AEAD: "Associate Executive Assistant Director",
  EAD: "Executive Assistant Director",
  ADD: "Associate Deputy Director",
  DD: "Deputy Director",
  DIRECTOR: "Director",
};

export const RANK_ABBR: Record<Rank, string> = {
  NAT: "NAT",
  SA: "SA",
  SSA_SENIOR: "Sr. SA",
  SSA: "SSA",
  ASAC: "ASAC",
  SAC: "SAC",
  AD: "AD",
  AEAD: "AEAD",
  EAD: "EAD",
  ADD: "ADD",
  DD: "DD",
  DIRECTOR: "Director",
};

export function rankLevel(rank: Rank): number {
  return RANK_ORDER.indexOf(rank);
}

export function rankAtLeast(rank: Rank, min: Rank): boolean {
  return rankLevel(rank) >= rankLevel(min);
}

// ---------------------------------------------------------------------------
// Permissions catalog
// ---------------------------------------------------------------------------

export const PERMISSIONS = [
  "investigation.view",
  "investigation.view.all",
  "investigation.create",
  "investigation.edit",
  "investigation.edit.any",
  "investigation.close",
  "investigation.delete",
  "investigation.assign",
  "investigation.supervise",
  "investigation.publish", // toggle public visibility

  "note.create",
  "timeline.create",

  "person.view",
  "person.create",
  "person.edit",
  "person.link", // link/unlink a person to an investigation
  "suspect.view",
  "suspect.create",
  "suspect.edit",
  "suspect.delete",

  "evidence.view",
  "evidence.create",
  "evidence.download",
  "evidence.delete",

  "document.view",
  "document.create",
  "document.delete",

  "warrant.view",
  "warrant.request",
  "warrant.edit",
  "warrant.approve",
  "warrant.delete",

  "arrest.create",
  "arrest.edit",
  "arrest.delete",

  "mostwanted.view",
  "mostwanted.create",
  "mostwanted.edit",
  "mostwanted.review",
  "mostwanted.publish",
  "mostwanted.archive",
  "mostwanted.delete",

  "applications.view",
  "applications.review",
  "applications.approve",
  "applications.reject",
  "applications.assign",

  "tips.view",
  "tips.view.all",
  "tips.assign",
  "tips.manage",

  "news.view",
  "news.create",
  "news.edit",
  "news.publish",

  "agents.view",
  "agents.manage",
  "agents.promote",
  "agents.demote",

  "reports.view",
  "reports.view.department",
  "reports.view.global",

  "audit.view",
  "audit.view.global",

  "system.manage", // platform administration (Admin only)
] as const;

export type Permission = (typeof PERMISSIONS)[number];

// ---------------------------------------------------------------------------
// Rank -> permissions
//
// Each rank inherits everything from the rank below it, plus its own additions.
// ---------------------------------------------------------------------------

const RANK_ADDITIONS: Record<Rank, Permission[]> = {
  NAT: [
    "investigation.view",
    "note.create",
    "timeline.create",
    "person.view",
    "suspect.view",
    "evidence.view",
    "document.view",
    "warrant.view",
    "mostwanted.view",
    "news.view",
    "agents.view",
  ],
  SA: [
    "investigation.create",
    "investigation.edit",
    "person.create",
    "person.edit",
    "person.link",
    "suspect.create",
    "suspect.edit",
    "evidence.create",
    "evidence.download",
    "document.create",
    "warrant.request",
    "warrant.edit",
    "arrest.create",
    "arrest.edit",
    "mostwanted.create", // propose / submit for review
    "tips.view", // tips linked to own cases
    "reports.view",
  ],
  SSA_SENIOR: [
    "investigation.supervise",
    "investigation.assign",
    "mostwanted.review",
    "reports.view.department",
  ],
  SSA: [
    "investigation.edit.any",
    "investigation.close",
    "investigation.publish",
    "suspect.delete",
    "warrant.delete",
    "arrest.delete",
    "mostwanted.edit",
    "mostwanted.publish",
    "applications.view",
    "applications.review",
    "applications.assign",
    "tips.view.all",
    "tips.assign",
    "tips.manage",
    "news.create",
    "news.edit",
    "audit.view",
  ],
  ASAC: [
    "applications.approve",
    "applications.reject",
    "warrant.approve",
    "news.publish",
    "reports.view.department",
  ],
  SAC: [
    "investigation.view.all", // within office scope (see visibility filter)
    "agents.manage",
    "agents.promote",
    "agents.demote",
    "mostwanted.archive",
    "reports.view.global",
  ],
  AD: ["audit.view.global"],
  AEAD: [],
  EAD: [],
  ADD: [],
  DD: [],
  DIRECTOR: [
    "investigation.delete",
    "evidence.delete",
    "document.delete",
    "mostwanted.delete",
  ],
};

const _rankPermissionCache = new Map<Rank, Set<Permission>>();

export function permissionsForRank(rank: Rank): Set<Permission> {
  const cached = _rankPermissionCache.get(rank);
  if (cached) return cached;

  const set = new Set<Permission>();
  for (const r of RANK_ORDER) {
    for (const p of RANK_ADDITIONS[r]) set.add(p);
    if (r === rank) break;
  }
  _rankPermissionCache.set(rank, set);
  return set;
}

// ---------------------------------------------------------------------------
// Actor abstraction
// ---------------------------------------------------------------------------

export interface Actor {
  userId: string;
  name: string;
  email: string;
  isAdmin: boolean;
  agent?: {
    id: string;
    badgeNumber: string;
    rank: Rank;
    title: string;
    division: string;
    unit: string | null;
    status: string;
    fieldOfficeId: string | null;
    fieldOfficeName: string | null;
    permissionGrants: string[];
    permissionRevokes: string[];
  } | null;
  /**
   * DB-backed adjustments to what the actor's rank grants (managed by the
   * Director in /agent/roles). Populated by getActor(); absent = code defaults.
   */
  rankOverrides?: { add: string[]; remove: string[] };
}

const ADMIN_PERMISSIONS: Permission[] = [
  "system.manage",
  "agents.view",
  "agents.manage",
  "audit.view",
  "audit.view.global",
];

export function effectivePermissions(actor: Actor): Set<Permission> {
  // The Director has unrestricted access to the entire platform — every
  // operational permission AND every technical/admin permission, no exception.
  if (actor.agent && actor.agent.status === "ACTIVE" && actor.agent.rank === "DIRECTOR") {
    return new Set(PERMISSIONS);
  }

  const set = new Set<Permission>();

  if (actor.isAdmin) {
    for (const p of ADMIN_PERMISSIONS) set.add(p);
  }

  if (actor.agent && actor.agent.status === "ACTIVE") {
    for (const p of permissionsForRank(actor.agent.rank)) set.add(p);
    // Rank-level overrides configured by the Director (rbac-store).
    if (actor.rankOverrides) {
      for (const g of actor.rankOverrides.add) {
        if ((PERMISSIONS as readonly string[]).includes(g)) set.add(g as Permission);
      }
      for (const r of actor.rankOverrides.remove) set.delete(r as Permission);
    }
    // Per-agent overrides always win over rank-level.
    for (const g of actor.agent.permissionGrants) {
      if ((PERMISSIONS as readonly string[]).includes(g)) set.add(g as Permission);
    }
    for (const r of actor.agent.permissionRevokes) set.delete(r as Permission);
  }

  return set;
}

/** True when the actor has platform-admin authority (rank Director OR isAdmin). */
export function isPlatformAdmin(actor: Actor | null | undefined): boolean {
  if (!actor) return false;
  return actor.isAdmin || actor.agent?.rank === "DIRECTOR";
}

export function can(actor: Actor | null | undefined, permission: Permission): boolean {
  if (!actor) return false;
  return effectivePermissions(actor).has(permission);
}

export function canAny(actor: Actor | null | undefined, perms: Permission[]): boolean {
  if (!actor) return false;
  const eff = effectivePermissions(actor);
  return perms.some((p) => eff.has(p));
}

export function assertCan(actor: Actor | null | undefined, permission: Permission): void {
  if (!can(actor, permission)) {
    throw new RbacError(`Permission manquante : ${permission}`);
  }
}

export class RbacError extends Error {
  status = 403;
  constructor(message = "Accès refusé") {
    super(message);
    this.name = "RbacError";
  }
}

// ---------------------------------------------------------------------------
// Data visibility — investigations
//
// Access to an investigation depends on: rank + assignment + office + class.
// ---------------------------------------------------------------------------

const CLASSIFICATION_MIN_RANK: Record<string, Rank> = {
  UNCLASSIFIED: "NAT",
  RESTRICTED: "SA",
  CONFIDENTIAL: "SSA_SENIOR",
  SECRET: "SSA",
};

export interface InvestigationVisibilityInput {
  id: string;
  classification: string;
  leadAgentId: string | null;
  fieldOfficeId: string | null;
  isPublic: boolean;
  assignedAgentIds: string[];
}

export function canViewInvestigation(
  actor: Actor | null | undefined,
  inv: InvestigationVisibilityInput,
): boolean {
  if (inv.isPublic) return true;
  if (!actor) return false;
  if (actor.isAdmin && !actor.agent) return false; // pure admin has no case access

  const agent = actor.agent;
  if (!agent || agent.status !== "ACTIVE") return false;

  const eff = effectivePermissions(actor);

  // Classification gate
  const minRank = CLASSIFICATION_MIN_RANK[inv.classification] ?? "NAT";
  const meetsClassification = rankAtLeast(agent.rank, minRank);

  // Direct involvement always grants access (still subject to classification)
  const involved =
    inv.leadAgentId === agent.id || inv.assignedAgentIds.includes(agent.id);
  if (involved && meetsClassification) return true;

  // Office-wide visibility (SAC+ / investigation.view.all) within own office
  if (eff.has("investigation.view.all") && meetsClassification) {
    // Director and DD see everything regardless of office
    if (rankAtLeast(agent.rank, "AD")) return true;
    if (agent.fieldOfficeId && agent.fieldOfficeId === inv.fieldOfficeId) return true;
    if (!inv.fieldOfficeId) return true;
    return false;
  }

  // Supervisors can see cases in their own office
  if (
    eff.has("investigation.supervise") &&
    meetsClassification &&
    agent.fieldOfficeId &&
    agent.fieldOfficeId === inv.fieldOfficeId
  ) {
    return true;
  }

  return false;
}

/**
 * Returns a Prisma `where` fragment that restricts investigations to those the
 * actor may see. Used for list endpoints so IDOR is impossible even in queries.
 */
export function investigationVisibilityFilter(actor: Actor | null | undefined): object {
  // Soft-deleted investigations are never returned by list / search queries.
  if (!actor) return { deletedAt: null, isPublic: true };

  const agent = actor.agent;
  if (!agent || agent.status !== "ACTIVE") return { deletedAt: null, isPublic: true };

  const eff = effectivePermissions(actor);

  // Director / DD — everything (still excluding the trash)
  if (rankAtLeast(agent.rank, "DD")) return { deletedAt: null };

  const clauses: object[] = [
    { isPublic: true },
    { leadAgentId: agent.id },
    { assignedAgents: { some: { agentId: agent.id } } },
  ];

  const allowedClassifications = Object.entries(CLASSIFICATION_MIN_RANK)
    .filter(([, min]) => rankAtLeast(agent.rank, min as Rank))
    .map(([c]) => c);

  if (eff.has("investigation.view.all") || eff.has("investigation.supervise")) {
    const officeClause: Record<string, unknown> = {
      classification: { in: allowedClassifications },
    };
    if (!rankAtLeast(agent.rank, "AD")) {
      officeClause.OR = [
        { fieldOfficeId: agent.fieldOfficeId },
        { fieldOfficeId: null },
      ];
    }
    clauses.push(officeClause);
  }

  return { deletedAt: null, OR: clauses };
}

// ---------------------------------------------------------------------------
// Rank management guard
// ---------------------------------------------------------------------------

export function canChangeRank(actor: Actor, targetCurrentRank: Rank, newRank: Rank): boolean {
  if (!can(actor, "agents.promote") && !can(actor, "agents.demote")) return false;
  const me = actor.agent;
  if (!me) return false;
  // Director can set any rank
  if (me.rank === "DIRECTOR") return true;
  // You can only manage agents strictly below your own rank, and cannot
  // promote anyone to your rank or above.
  return (
    rankLevel(targetCurrentRank) < rankLevel(me.rank) &&
    rankLevel(newRank) < rankLevel(me.rank)
  );
}
