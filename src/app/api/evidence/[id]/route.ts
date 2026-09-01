export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { handle, ok, fail } from "@/lib/api";
import { evidenceUpdateSchema } from "@/lib/validation";
import { requireApiActor } from "@/lib/auth";
import { getInvestigationForEditOr404, canEditInvestigation } from "@/lib/access";
import { can } from "@/lib/rbac";
import { addTimelineEvent } from "@/lib/timeline";
import { audit } from "@/lib/audit";

async function loadEvidence(id: string, actor: Parameters<typeof getInvestigationForEditOr404>[1]) {
  const ev = await prisma.evidence.findFirst({ where: { id, deletedAt: null } });
  if (!ev) return null;
  const inv = await getInvestigationForEditOr404(ev.investigationId, actor);
  const mayEdit = canEditInvestigation(actor, {
    leadAgentId: inv.leadAgentId,
    assignedAgentIds: inv.assignedAgentIds,
  });
  return { ev, inv, mayEdit };
}

export const PATCH = handle(
  async (req: Request, { params }: { params: { id: string } }) => {
    const actor = await requireApiActor();
    if (!can(actor, "evidence.create")) {
      return fail("Permission manquante : evidence.create", 403);
    }
    const loaded = await loadEvidence(params.id, actor);
    if (!loaded) return fail("Preuve introuvable.", 404);
    if (!loaded.mayEdit) return fail("Vous n'êtes pas affecté à cette enquête.", 403);
    const { ev, inv } = loaded;

    const d = evidenceUpdateSchema.parse(await req.json());
    const updated = await prisma.evidence.update({
      where: { id: ev.id },
      data: {
        title: d.title ?? undefined,
        type: d.type ?? undefined,
        description: d.description ?? undefined,
        chainOfCustody: d.chainOfCustody ?? undefined,
        personId: d.personId !== undefined ? d.personId || null : undefined,
      },
    });

    await audit(actor, {
      action: "evidence.update",
      entityType: "investigation",
      entityId: inv.id,
      summary: `${actor.name} a modifié la preuve #${ev.evidenceNumber} (${inv.caseNumber})`,
    });
    return ok(updated);
  },
);

export const DELETE = handle(
  async (_req: Request, { params }: { params: { id: string } }) => {
    const actor = await requireApiActor();
    if (!can(actor, "evidence.delete")) {
      return fail("Permission manquante : evidence.delete", 403);
    }
    const loaded = await loadEvidence(params.id, actor);
    if (!loaded) return fail("Preuve introuvable.", 404);
    const { ev, inv } = loaded;

    await prisma.evidence.update({
      where: { id: ev.id },
      data: { deletedAt: new Date(), deletedById: actor.agent?.id ?? null },
    });
    await addTimelineEvent(
      inv.id,
      "INVESTIGATION_UPDATED",
      `${actor.name} a retiré la preuve #${ev.evidenceNumber} — ${ev.title}`,
      actor,
    );
    await audit(actor, {
      action: "evidence.delete",
      entityType: "investigation",
      entityId: inv.id,
      summary: `${actor.name} a placé la preuve #${ev.evidenceNumber} dans la corbeille (${inv.caseNumber})`,
    });
    return ok({ deleted: true });
  },
);
