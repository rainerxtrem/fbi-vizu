import "server-only";
import { prisma } from "./db";
import type { Actor } from "./rbac";
import { canViewInvestigation, RbacError, can } from "./rbac";

/**
 * Loads an investigation and enforces per-record visibility. Throws RbacError
 * (404-style — we return "not found" to avoid leaking existence) when the actor
 * may not see it. This is the guard against IDOR via URL tampering.
 */
export async function getInvestigationOr404(
  id: string,
  actor: Actor | null,
  opts: { allowDeleted?: boolean } = {},
) {
  const inv = await prisma.investigation.findUnique({
    where: { id },
    include: {
      leadAgent: { include: { user: true, fieldOffice: true } },
      fieldOffice: true,
      assignedAgents: { include: { agent: { include: { user: true } } } },
      charges: { include: { charge: true, person: true } },
      persons: { where: { person: { deletedAt: null } }, include: { person: true } },
      evidence: {
        where: { deletedAt: null },
        include: { collectedBy: { include: { user: true } }, file: true, person: true },
        orderBy: { collectedAt: "desc" },
      },
      documents: { include: { uploadedBy: { include: { user: true } }, file: true } },
      notes: { include: { author: { include: { user: true } } }, orderBy: { createdAt: "desc" } },
      timeline: {
        include: { actorAgent: { include: { user: true } } },
        orderBy: { occurredAt: "desc" },
      },
      vehicles: { include: { vehicle: true } },
      organizations: { include: { organization: true } },
      locations: true,
      warrants: {
        where: { deletedAt: null },
        include: {
          person: true,
          requestedBy: { include: { user: true } },
          approvedBy: { include: { user: true } },
        },
      },
      arrests: {
        where: { deletedAt: null },
        include: {
          person: true,
          arrestingAgent: { include: { user: true } },
          chargeLinks: { include: { charge: true } },
        },
      },
      mostWanted: true,
      relatedFrom: { include: { to: true } },
      relatedTo: { include: { from: true } },
    },
  });

  if (!inv || (inv.deletedAt && !opts.allowDeleted)) {
    const e = new RbacError("Enquête introuvable");
    e.status = 404;
    throw e;
  }

  const allowed = canViewInvestigation(actor, {
    id: inv.id,
    classification: inv.classification,
    leadAgentId: inv.leadAgentId,
    fieldOfficeId: inv.fieldOfficeId,
    isPublic: inv.isPublic,
    assignedAgentIds: inv.assignedAgents.map((a) => a.agentId),
  });

  if (!allowed) {
    const e = new RbacError("Enquête introuvable");
    e.status = 404;
    throw e;
  }

  return inv;
}

/** Whether the actor may edit this investigation (lead, assigned + edit, or edit.any). */
export function canEditInvestigation(
  actor: Actor | null,
  inv: { leadAgentId: string | null; assignedAgentIds: string[] },
): boolean {
  if (!actor?.agent) return false;
  if (can(actor, "investigation.edit.any")) return true;
  if (!can(actor, "investigation.edit")) return false;
  return (
    inv.leadAgentId === actor.agent.id ||
    inv.assignedAgentIds.includes(actor.agent.id)
  );
}
