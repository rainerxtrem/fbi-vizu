export const dynamic = "force-dynamic";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { handle, ok, created, fail } from "@/lib/api";
import { requireApiActor } from "@/lib/auth";
import { getInvestigationForEditOr404, canEditInvestigation } from "@/lib/access";
import { can } from "@/lib/rbac";
import { addTimelineEvent } from "@/lib/timeline";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notify";

async function guard(id: string, actor: Parameters<typeof getInvestigationForEditOr404>[1]) {
  const inv = await getInvestigationForEditOr404(id, actor);
  const mayManage =
    can(actor, "investigation.assign") &&
    (canEditInvestigation(actor, {
      leadAgentId: inv.leadAgentId,
      assignedAgentIds: inv.assignedAgentIds,
    }) ||
      can(actor, "investigation.supervise") ||
      can(actor, "investigation.edit.any"));
  return { inv, mayManage };
}

export const POST = handle(async (req: Request, { params }: { params: { id: string } }) => {
  const actor = await requireApiActor();
  const { inv, mayManage } = await guard(params.id, actor);
  if (!mayManage) return fail("Permission manquante : investigation.assign", 403);

  const { agentId, role } = z
    .object({ agentId: z.string().min(1).max(40), role: z.string().max(120).optional() })
    .parse(await req.json());

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: { user: true },
  });
  if (!agent || agent.status !== "ACTIVE") return fail("Agent introuvable ou inactif.", 404);

  const link = await prisma.investigationAgent
    .create({
      data: { investigationId: inv.id, agentId, role: role || "Agent affecté" },
    })
    .catch(() => null);
  if (!link) return fail("Cet agent est déjà affecté au dossier.", 409);

  await addTimelineEvent(
    inv.id,
    "AGENT_ASSIGNED",
    `${actor.name} a affecté ${agent.user.name} au dossier`,
    actor,
  );
  await audit(actor, {
    action: "investigation.agent.add",
    entityType: "investigation",
    entityId: inv.id,
    summary: `${actor.name} a affecté ${agent.user.name} à ${inv.caseNumber}`,
  });
  await notify([agentId], {
    type: "CASE_ASSIGNED",
    title: `Affecté à l'enquête ${inv.caseNumber}`,
    body: inv.title,
    linkUrl: `/agent/investigations/${inv.id}`,
  });

  return created({ id: link.id });
});

export const DELETE = handle(async (req: Request, { params }: { params: { id: string } }) => {
  const actor = await requireApiActor();
  const { inv, mayManage } = await guard(params.id, actor);
  if (!mayManage) return fail("Permission manquante : investigation.assign", 403);

  const { agentId } = z.object({ agentId: z.string().min(1).max(40) }).parse(await req.json());

  const link = await prisma.investigationAgent.findFirst({
    where: { investigationId: inv.id, agentId },
    include: { agent: { include: { user: true } } },
  });
  if (!link) return fail("Affectation introuvable.", 404);

  await prisma.investigationAgent.delete({ where: { id: link.id } });
  await audit(actor, {
    action: "investigation.agent.remove",
    entityType: "investigation",
    entityId: inv.id,
    summary: `${actor.name} a retiré ${link.agent.user.name} de ${inv.caseNumber}`,
  });
  return ok({ removed: true });
});
