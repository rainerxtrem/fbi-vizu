export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { handle, ok, fail } from "@/lib/api";
import { arrestUpdateSchema } from "@/lib/validation";
import { requireApiActor } from "@/lib/auth";
import { getInvestigationOr404, canEditInvestigation } from "@/lib/access";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";

async function loadArrest(id: string, actor: Parameters<typeof getInvestigationOr404>[1]) {
  const a = await prisma.arrest.findUnique({ where: { id }, include: { person: true } });
  if (!a || a.deletedAt) return null;
  const inv = await getInvestigationOr404(a.investigationId, actor);
  return { a, inv };
}

export const PATCH = handle(
  async (req: Request, { params }: { params: { id: string } }) => {
    const actor = await requireApiActor();
    if (!can(actor, "arrest.edit")) {
      return fail("Permission manquante : arrest.edit", 403);
    }
    const loaded = await loadArrest(params.id, actor);
    if (!loaded) return fail("Arrestation introuvable.", 404);
    const { a, inv } = loaded;

    const assignedAgentIds = inv.assignedAgents.map((x) => x.agentId);
    if (!canEditInvestigation(actor, { leadAgentId: inv.leadAgentId, assignedAgentIds })) {
      return fail("Vous n'êtes pas affecté à cette enquête.", 403);
    }

    const d = arrestUpdateSchema.parse(await req.json());

    if (d.chargeIds !== undefined) {
      const valid = d.chargeIds.length
        ? await prisma.charge.findMany({
            where: { id: { in: d.chargeIds } },
            select: { id: true },
          })
        : [];
      await prisma.$transaction([
        prisma.arrestCharge.deleteMany({ where: { arrestId: a.id } }),
        prisma.arrestCharge.createMany({
          data: valid.map((c) => ({ arrestId: a.id, chargeId: c.id })),
        }),
      ]);
    }

    const updated = await prisma.arrest.update({
      where: { id: a.id },
      data: {
        personId: d.personId || undefined,
        arrestDate: d.arrestDate ? new Date(d.arrestDate) : undefined,
        location: d.location ?? undefined,
        charges: d.charges ?? undefined,
        notes: d.notes ?? undefined,
        arrestingAgentId: d.arrestingAgentId !== undefined ? d.arrestingAgentId || null : undefined,
      },
    });

    await audit(actor, {
      action: "arrest.update",
      entityType: "investigation",
      entityId: inv.id,
      summary: `${actor.name} a mis à jour l'arrestation de ${a.person.fullName} (${inv.caseNumber})`,
    });
    return ok(updated);
  },
);

export const DELETE = handle(
  async (_req: Request, { params }: { params: { id: string } }) => {
    const actor = await requireApiActor();
    if (!can(actor, "arrest.delete")) {
      return fail("Permission manquante : arrest.delete", 403);
    }
    const loaded = await loadArrest(params.id, actor);
    if (!loaded) return fail("Arrestation introuvable.", 404);
    const { a, inv } = loaded;

    await prisma.arrest.update({
      where: { id: a.id },
      data: { deletedAt: new Date(), deletedById: actor.agent?.id ?? null },
    });
    await audit(actor, {
      action: "arrest.delete",
      entityType: "investigation",
      entityId: inv.id,
      summary: `${actor.name} a placé l'arrestation de ${a.person.fullName} dans la corbeille (${inv.caseNumber})`,
    });
    return ok({ deleted: true });
  },
);
