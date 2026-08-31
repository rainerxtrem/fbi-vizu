export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { handle, created, fail } from "@/lib/api";
import { evidenceSchema } from "@/lib/validation";
import { requireApiPermission } from "@/lib/auth";
import { getInvestigationOr404, canEditInvestigation } from "@/lib/access";
import { nextEvidenceNumber } from "@/lib/ids";
import { addTimelineEvent } from "@/lib/timeline";
import { audit } from "@/lib/audit";

export const POST = handle(async (req: Request) => {
  const actor = await requireApiPermission("evidence.create");
  const d = evidenceSchema.parse(await req.json());
  const inv = await getInvestigationOr404(d.investigationId, actor);

  const assignedAgentIds = inv.assignedAgents.map((a) => a.agentId);
  if (!canEditInvestigation(actor, { leadAgentId: inv.leadAgentId, assignedAgentIds })) {
    return fail("You are not assigned to this investigation.", 403);
  }

  let fileId: string | null = null;
  if (d.fileUrl) {
    const asset = await prisma.fileAsset.findFirst({ where: { url: d.fileUrl } });
    fileId = asset?.id ?? null;
  }

  const evidenceNumber = await nextEvidenceNumber();
  const ev = await prisma.evidence.create({
    data: {
      investigationId: inv.id,
      evidenceNumber,
      title: d.title,
      type: d.type,
      description: d.description ?? null,
      chainOfCustody: d.chainOfCustody ?? null,
      personId: d.personId || null,
      fileId,
      collectedById: actor.agent?.id ?? null,
    },
  });

  await addTimelineEvent(
    inv.id,
    "EVIDENCE_ADDED",
    `${actor.name} added evidence #${evidenceNumber} — ${d.title}`,
    actor,
  );
  await audit(actor, {
    action: "evidence.create",
    entityType: "investigation",
    entityId: inv.id,
    summary: `${actor.name} added evidence #${evidenceNumber} to ${inv.caseNumber}`,
  });

  return created(ev);
});
