export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { handle, created, fail } from "@/lib/api";
import { arrestCreateSchema } from "@/lib/validation";
import { requireApiPermission } from "@/lib/auth";
import { getInvestigationOr404, canEditInvestigation } from "@/lib/access";
import { addTimelineEvent } from "@/lib/timeline";
import { audit } from "@/lib/audit";

export const POST = handle(async (req: Request) => {
  const actor = await requireApiPermission("arrest.create");
  const d = arrestCreateSchema.parse(await req.json());
  const inv = await getInvestigationOr404(d.investigationId, actor);

  const assignedAgentIds = inv.assignedAgents.map((a) => a.agentId);
  if (!canEditInvestigation(actor, { leadAgentId: inv.leadAgentId, assignedAgentIds })) {
    return fail("Vous n'êtes pas affecté à cette enquête.", 403);
  }

  const person = await prisma.person.findUnique({ where: { id: d.personId } });
  if (!person) return fail("Personne introuvable.", 404);

  const a = await prisma.arrest.create({
    data: {
      investigationId: inv.id,
      personId: d.personId,
      arrestDate: d.arrestDate ? new Date(d.arrestDate) : new Date(),
      location: d.location ?? null,
      charges: d.charges ?? null,
      notes: d.notes ?? null,
      arrestingAgentId: d.arrestingAgentId || actor.agent?.id || null,
    },
  });

  await addTimelineEvent(
    inv.id,
    "ARREST_MADE",
    `${actor.name} a enregistré l'arrestation de ${person.fullName}`,
    actor,
  );
  await audit(actor, {
    action: "arrest.create",
    entityType: "investigation",
    entityId: inv.id,
    summary: `${actor.name} a enregistré l'arrestation de ${person.fullName} sur ${inv.caseNumber}`,
  });

  return created(a);
});
