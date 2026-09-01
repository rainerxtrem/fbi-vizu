export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { handle, created, fail } from "@/lib/api";
import { warrantCreateSchema } from "@/lib/validation";
import { requireApiPermission } from "@/lib/auth";
import { getInvestigationForEditOr404, canEditInvestigation } from "@/lib/access";
import { can } from "@/lib/rbac";
import { nextWarrantNumber } from "@/lib/ids";
import { addTimelineEvent } from "@/lib/timeline";
import { audit } from "@/lib/audit";

export const POST = handle(async (req: Request) => {
  const actor = await requireApiPermission("warrant.request");
  const d = warrantCreateSchema.parse(await req.json());
  const inv = await getInvestigationForEditOr404(d.investigationId, actor);

  if (!canEditInvestigation(actor, { leadAgentId: inv.leadAgentId, assignedAgentIds: inv.assignedAgentIds })) {
    return fail("Vous n'êtes pas affecté à cette enquête.", 403);
  }
  // Only an approver can create a warrant already in an approved/active state.
  if (
    ["APPROVED", "ACTIVE"].includes(d.status) &&
    !can(actor, "warrant.approve")
  ) {
    d.status = "REQUESTED";
  }

  const warrantNumber = await nextWarrantNumber();
  const w = await prisma.warrant.create({
    data: {
      warrantNumber,
      investigationId: inv.id,
      type: d.type,
      status: d.status,
      personId: d.personId || null,
      description: d.description ?? null,
      issuingJudge: d.issuingJudge ?? null,
      issuedDate: d.issuedDate ? new Date(d.issuedDate) : null,
      expiryDate: d.expiryDate ? new Date(d.expiryDate) : null,
      requestedById: actor.agent?.id ?? null,
      approvedById:
        ["APPROVED", "ACTIVE"].includes(d.status) ? actor.agent?.id ?? null : null,
    },
  });

  await addTimelineEvent(
    inv.id,
    "WARRANT_REQUESTED",
    `${actor.name} a créé le mandat ${warrantNumber} (${d.type})`,
    actor,
  );
  await audit(actor, {
    action: "warrant.create",
    entityType: "investigation",
    entityId: inv.id,
    summary: `${actor.name} a créé le mandat ${warrantNumber} sur ${inv.caseNumber}`,
  });

  return created(w);
});
