export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { handle, created, fail } from "@/lib/api";
import { arrestCreateSchema } from "@/lib/validation";
import { requireApiPermission } from "@/lib/auth";
import { getInvestigationOr404, canEditInvestigation } from "@/lib/access";
import { addTimelineEvent } from "@/lib/timeline";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notify";

export const POST = handle(async (req: Request) => {
  const actor = await requireApiPermission("arrest.create");
  const d = arrestCreateSchema.parse(await req.json());
  const inv = await getInvestigationOr404(d.investigationId, actor);

  const assignedAgentIds = inv.assignedAgents.map((a) => a.agentId);
  if (!canEditInvestigation(actor, { leadAgentId: inv.leadAgentId, assignedAgentIds })) {
    return fail("Vous n'êtes pas affecté à cette enquête.", 403);
  }

  const person = await prisma.person.findFirst({
    where: { id: d.personId, deletedAt: null },
  });
  if (!person) return fail("Personne introuvable.", 404);

  const validCharges = d.chargeIds.length
    ? await prisma.charge.findMany({
        where: { id: { in: d.chargeIds } },
        select: { id: true },
      })
    : [];

  const a = await prisma.arrest.create({
    data: {
      investigationId: inv.id,
      personId: d.personId,
      arrestDate: d.arrestDate ? new Date(d.arrestDate) : new Date(),
      location: d.location ?? null,
      charges: d.charges ?? null,
      notes: d.notes ?? null,
      arrestingAgentId: d.arrestingAgentId || actor.agent?.id || null,
      chargeLinks: {
        create: validCharges.map((c) => ({ chargeId: c.id })),
      },
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
  await notify(
    [inv.leadAgentId, ...assignedAgentIds].filter((id) => id && id !== actor.agent?.id),
    {
      type: "ARREST_MADE",
      title: `Arrestation sur ${inv.caseNumber}`,
      body: `${person.fullName} — enregistrée par ${actor.name}`,
      linkUrl: `/agent/investigations/${inv.id}`,
    },
  );

  return created(a);
});
