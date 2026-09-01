export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { handle, ok, fail } from "@/lib/api";
import { investigationUpdateSchema } from "@/lib/validation";
import { requireApiActor, requireApiPermission } from "@/lib/auth";
import { getInvestigationOr404, canEditInvestigation } from "@/lib/access";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { addTimelineEvent } from "@/lib/timeline";

export const GET = handle(
  async (_req: Request, { params }: { params: { id: string } }) => {
    const actor = await requireApiActor();
    const inv = await getInvestigationOr404(params.id, actor);
    return ok(inv);
  },
);

export const PATCH = handle(
  async (req: Request, { params }: { params: { id: string } }) => {
    const actor = await requireApiActor();
    const inv = await getInvestigationOr404(params.id, actor);
    const assignedAgentIds = inv.assignedAgents.map((a) => a.agentId);

    if (!canEditInvestigation(actor, { leadAgentId: inv.leadAgentId, assignedAgentIds })) {
      return fail("Vous n'êtes pas autorisé à modifier cette enquête.", 403);
    }

    const d = investigationUpdateSchema.parse(await req.json());

    // Closing requires investigation.close
    if (
      d.status &&
      ["CLOSED", "ARCHIVED"].includes(d.status) &&
      inv.status !== d.status &&
      !can(actor, "investigation.close")
    ) {
      return fail("Vous n'êtes pas autorisé à clôturer cette enquête.", 403);
    }
    // Public visibility toggle requires investigation.publish
    if (d.isPublic !== undefined && d.isPublic !== inv.isPublic && !can(actor, "investigation.publish")) {
      return fail("Vous n'êtes pas autorisé à modifier la visibilité publique.", 403);
    }

    const updated = await prisma.investigation.update({
      where: { id: inv.id },
      data: {
        title: d.title ?? undefined,
        description: d.description ?? undefined,
        classification: d.classification ?? undefined,
        priority: d.priority ?? undefined,
        status: d.status ?? undefined,
        leadAgentId: d.leadAgentId || undefined,
        fieldOfficeId: d.fieldOfficeId || undefined,
        division: d.division ?? undefined,
        unit: d.unit ?? undefined,
        taskForce: d.taskForce ?? undefined,
        incidentDate: d.incidentDate ? new Date(d.incidentDate) : undefined,
        incidentLocation: d.incidentLocation ?? undefined,
        jurisdiction: d.jurisdiction ?? undefined,
        isPublic: d.isPublic ?? undefined,
        closedAt:
          d.status && ["CLOSED", "ARCHIVED"].includes(d.status)
            ? new Date()
            : d.status
              ? null
              : undefined,
      },
    });

    if (d.status && d.status !== inv.status) {
      await addTimelineEvent(
        inv.id,
        "STATUS_CHANGED",
        `Statut modifié de ${inv.status} à ${d.status} par ${actor.name}`,
        actor,
      );
    } else {
      await addTimelineEvent(
        inv.id,
        "INVESTIGATION_UPDATED",
        `Détails du dossier mis à jour par ${actor.name}`,
        actor,
      );
    }

    await audit(actor, {
      action: "investigation.update",
      entityType: "investigation",
      entityId: inv.id,
      summary: `${actor.name} a mis à jour ${inv.caseNumber}${d.status ? ` (statut → ${d.status})` : ""}`,
      meta: { changes: Object.keys(d) },
    });

    return ok(updated);
  },
);

export const DELETE = handle(
  async (_req: Request, { params }: { params: { id: string } }) => {
    const actor = await requireApiPermission("investigation.delete");
    const inv = await prisma.investigation.findUnique({ where: { id: params.id } });
    if (!inv || inv.deletedAt) return fail("Enquête introuvable.", 404);

    // Soft delete — the dossier is hidden everywhere but stays restorable from
    // the trash (Corbeille).
    await prisma.investigation.update({
      where: { id: inv.id },
      data: { deletedAt: new Date(), deletedById: actor.agent?.id ?? null },
    });
    await audit(actor, {
      action: "investigation.delete",
      entityType: "investigation",
      entityId: inv.id,
      summary: `${actor.name} a placé l'enquête ${inv.caseNumber} dans la corbeille`,
    });
    return ok({ deleted: true });
  },
);
