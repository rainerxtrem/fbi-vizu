export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { handle, ok, fail } from "@/lib/api";
import { requireApiActor } from "@/lib/auth";
import { getInvestigationForEditOr404, canEditInvestigation } from "@/lib/access";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";

export const DELETE = handle(
  async (_req: Request, { params }: { params: { id: string } }) => {
    const actor = await requireApiActor();
    if (!can(actor, "document.delete")) {
      return fail("Permission manquante : document.delete", 403);
    }
    const doc = await prisma.document.findUnique({ where: { id: params.id } });
    if (!doc || !doc.investigationId) return fail("Document introuvable.", 404);

    const inv = await getInvestigationForEditOr404(doc.investigationId, actor);
    if (
      !canEditInvestigation(actor, {
        leadAgentId: inv.leadAgentId,
        assignedAgentIds: inv.assignedAgentIds,
      })
    ) {
      return fail("Vous n'êtes pas affecté à cette enquête.", 403);
    }

    await prisma.document.delete({ where: { id: doc.id } });
    await audit(actor, {
      action: "document.delete",
      entityType: "investigation",
      entityId: inv.id,
      summary: `${actor.name} a supprimé le document « ${doc.title} » de ${inv.caseNumber}`,
    });
    return ok({ deleted: true });
  },
);
