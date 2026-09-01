export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { handle, created, fail } from "@/lib/api";
import { documentCreateSchema } from "@/lib/validation";
import { requireApiPermission } from "@/lib/auth";
import { getInvestigationForEditOr404, canEditInvestigation } from "@/lib/access";
import { addTimelineEvent } from "@/lib/timeline";
import { audit } from "@/lib/audit";

export const POST = handle(async (req: Request) => {
  const actor = await requireApiPermission("document.create");
  const d = documentCreateSchema.parse(await req.json());
  const inv = await getInvestigationForEditOr404(d.investigationId, actor);

  if (
    !canEditInvestigation(actor, {
      leadAgentId: inv.leadAgentId,
      assignedAgentIds: inv.assignedAgentIds,
    })
  ) {
    return fail("Vous n'êtes pas affecté à cette enquête.", 403);
  }

  let fileId: string | null = null;
  if (d.fileUrl) {
    const asset = await prisma.fileAsset.findFirst({ where: { url: d.fileUrl } });
    fileId = asset?.id ?? null;
  }

  const doc = await prisma.document.create({
    data: {
      investigationId: inv.id,
      title: d.title,
      category: d.category || "Général",
      description: d.description ?? null,
      fileId,
      uploadedById: actor.agent?.id ?? null,
    },
  });

  await addTimelineEvent(
    inv.id,
    "DOCUMENT_ADDED",
    `${actor.name} a ajouté le document « ${d.title} »`,
    actor,
  );
  await audit(actor, {
    action: "document.create",
    entityType: "investigation",
    entityId: inv.id,
    summary: `${actor.name} a ajouté un document à ${inv.caseNumber}`,
  });

  return created(doc);
});
