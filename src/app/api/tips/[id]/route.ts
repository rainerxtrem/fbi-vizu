export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { handle, ok, fail } from "@/lib/api";
import { tipUpdateSchema } from "@/lib/validation";
import { requireApiPermission } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notify";

export const PATCH = handle(
  async (req: Request, { params }: { params: { id: string } }) => {
    const actor = await requireApiPermission("tips.assign");
    const data = tipUpdateSchema.parse(await req.json());

    const tip = await prisma.tip.findUnique({ where: { id: params.id } });
    if (!tip) return fail("Renseignement introuvable.", 404);

    const updated = await prisma.tip.update({
      where: { id: params.id },
      data: {
        status: data.status ?? undefined,
        assignedToId: data.assignedToId || null,
        investigationId: data.investigationId || null,
      },
    });

    await audit(actor, {
      action: "tip.updated",
      entityType: "tip",
      entityId: tip.id,
      summary: `${actor.name} a mis à jour le renseignement ${tip.publicId}`,
      meta: { status: data.status, assignedToId: data.assignedToId },
    });

    if (
      data.assignedToId &&
      data.assignedToId !== tip.assignedToId &&
      data.assignedToId !== actor.agent?.id
    ) {
      await notify([data.assignedToId], {
        type: "TIP_ASSIGNED",
        title: `Renseignement ${tip.publicId} qui vous est assigné`,
        body: tip.subject,
        linkUrl: "/agent/tips",
      });
    }

    return ok(updated);
  },
);
