export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { handle, ok, fail } from "@/lib/api";
import { warrantUpdateSchema } from "@/lib/validation";
import { requireApiActor } from "@/lib/auth";
import { getInvestigationOr404, canEditInvestigation } from "@/lib/access";
import { can } from "@/lib/rbac";
import { addTimelineEvent } from "@/lib/timeline";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notify";

async function loadWarrant(id: string, actor: Parameters<typeof getInvestigationOr404>[1]) {
  const w = await prisma.warrant.findUnique({ where: { id } });
  if (!w) return null;
  const inv = await getInvestigationOr404(w.investigationId, actor);
  return { w, inv };
}

export const PATCH = handle(
  async (req: Request, { params }: { params: { id: string } }) => {
    const actor = await requireApiActor();
    const loaded = await loadWarrant(params.id, actor);
    if (!loaded) return fail("Mandat introuvable.", 404);
    const { w, inv } = loaded;

    const assignedAgentIds = inv.assignedAgents.map((a) => a.agentId);
    const mayEdit =
      can(actor, "warrant.edit") &&
      canEditInvestigation(actor, { leadAgentId: inv.leadAgentId, assignedAgentIds });
    if (!mayEdit && !can(actor, "warrant.approve")) {
      return fail("Vous n'êtes pas autorisé à modifier ce mandat.", 403);
    }

    const d = warrantUpdateSchema.parse(await req.json());

    // Moving a warrant into an approved/active state requires warrant.approve.
    const approving =
      d.status &&
      ["APPROVED", "ACTIVE"].includes(d.status) &&
      !["APPROVED", "ACTIVE"].includes(w.status);
    if (approving && !can(actor, "warrant.approve")) {
      return fail("Seul un Agent habilité peut approuver un mandat.", 403);
    }

    const denying = d.status === "DENIED" && w.status !== "DENIED";

    // Publishing a public "wanted notice" is a publication act.
    const togglingPublic = d.isPublic !== undefined && d.isPublic !== w.isPublic;
    if (
      (togglingPublic || d.publicSummary !== undefined) &&
      !can(actor, "warrant.approve") &&
      !can(actor, "investigation.publish")
    ) {
      return fail("Vous n'êtes pas autorisé à publier ce mandat.", 403);
    }

    const updated = await prisma.warrant.update({
      where: { id: w.id },
      data: {
        type: d.type ?? undefined,
        status: d.status ?? undefined,
        personId: d.personId !== undefined ? d.personId || null : undefined,
        description: d.description ?? undefined,
        issuingJudge: d.issuingJudge ?? undefined,
        issuedDate: d.issuedDate ? new Date(d.issuedDate) : undefined,
        expiryDate: d.expiryDate ? new Date(d.expiryDate) : undefined,
        deniedReason: denying ? d.deniedReason ?? null : undefined,
        isPublic: d.isPublic ?? undefined,
        publicSummary: d.publicSummary ?? undefined,
        approvedById: approving ? actor.agent?.id ?? null : undefined,
      },
    });

    if (d.status && d.status !== w.status) {
      await addTimelineEvent(
        inv.id,
        d.status === "APPROVED" ? "WARRANT_APPROVED" : "INVESTIGATION_UPDATED",
        `${actor.name} a fait passer le mandat ${w.warrantNumber} au statut ${d.status}`,
        actor,
      );
    }
    await audit(actor, {
      action: "warrant.update",
      entityType: "investigation",
      entityId: inv.id,
      summary: `${actor.name} a mis à jour le mandat ${w.warrantNumber}${
        d.status ? ` → ${d.status}` : ""
      }`,
    });

    if ((approving || denying) && w.requestedById && w.requestedById !== actor.agent?.id) {
      await notify([w.requestedById], {
        type: approving ? "WARRANT_APPROVED" : "WARRANT_DENIED",
        title: approving
          ? `Mandat ${w.warrantNumber} approuvé`
          : `Mandat ${w.warrantNumber} refusé`,
        body: approving
          ? `Approuvé par ${actor.name} (${inv.caseNumber})`
          : `Refusé par ${actor.name}${d.deniedReason ? ` — ${d.deniedReason}` : ""}`,
        linkUrl: `/agent/investigations/${inv.id}`,
      });
    }

    return ok(updated);
  },
);

export const DELETE = handle(
  async (_req: Request, { params }: { params: { id: string } }) => {
    const actor = await requireApiActor();
    if (!can(actor, "warrant.delete")) {
      return fail("Permission manquante : warrant.delete", 403);
    }
    const loaded = await loadWarrant(params.id, actor);
    if (!loaded) return fail("Mandat introuvable.", 404);
    const { w, inv } = loaded;

    await prisma.warrant.delete({ where: { id: w.id } });
    await audit(actor, {
      action: "warrant.delete",
      entityType: "investigation",
      entityId: inv.id,
      summary: `${actor.name} a supprimé le mandat ${w.warrantNumber} de ${inv.caseNumber}`,
    });
    return ok({ deleted: true });
  },
);
