export const dynamic = "force-dynamic";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { handle, created, fail } from "@/lib/api";
import { requireApiPermission } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";

export const POST = handle(async (req: Request, { params }: { params: { id: string } }) => {
  const actor = await requireApiPermission("tips.view");

  const tip = await prisma.tip.findUnique({
    where: { id: params.id },
    include: { investigation: { select: { leadAgentId: true } } },
  });
  if (!tip) return fail("Renseignement introuvable.", 404);

  const mine =
    tip.assignedToId === actor.agent?.id ||
    tip.investigation?.leadAgentId === actor.agent?.id;
  if (!can(actor, "tips.view.all") && !mine) {
    return fail("Ce renseignement n'est pas dans votre file.", 403);
  }

  const { body } = z.object({ body: z.string().trim().min(1).max(8000) }).parse(await req.json());

  const note = await prisma.tipNote.create({
    data: { tipId: tip.id, authorId: actor.agent?.id ?? null, body },
  });
  await audit(actor, {
    action: "tip.note.add",
    entityType: "tip",
    entityId: tip.id,
    summary: `${actor.name} a ajouté une note au renseignement ${tip.publicId}`,
  });
  return created({ id: note.id });
});
