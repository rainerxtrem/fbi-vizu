export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { handle, ok, fail } from "@/lib/api";
import { tipUpdateSchema } from "@/lib/validation";
import { requireApiPermission } from "@/lib/auth";
import { audit } from "@/lib/audit";

export const PATCH = handle(
  async (req: Request, { params }: { params: { id: string } }) => {
    const actor = await requireApiPermission("tips.assign");
    const data = tipUpdateSchema.parse(await req.json());

    const tip = await prisma.tip.findUnique({ where: { id: params.id } });
    if (!tip) return fail("Tip not found.", 404);

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
      summary: `${actor.name} updated tip ${tip.publicId}`,
      meta: { status: data.status, assignedToId: data.assignedToId },
    });

    return ok(updated);
  },
);
