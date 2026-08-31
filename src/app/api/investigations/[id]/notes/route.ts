export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { handle, created, fail } from "@/lib/api";
import { noteSchema } from "@/lib/validation";
import { requireApiPermission } from "@/lib/auth";
import { getInvestigationOr404 } from "@/lib/access";
import { addTimelineEvent } from "@/lib/timeline";
import { audit } from "@/lib/audit";

export const POST = handle(
  async (req: Request, { params }: { params: { id: string } }) => {
    const actor = await requireApiPermission("note.create");
    const inv = await getInvestigationOr404(params.id, actor);
    if (!actor.agent) return fail("Agents only.", 403);
    const { body } = noteSchema.parse(await req.json());

    const note = await prisma.investigationNote.create({
      data: { investigationId: inv.id, authorId: actor.agent.id, body },
      include: { author: { include: { user: true } } },
    });

    await addTimelineEvent(inv.id, "NOTE_ADDED", `${actor.name} added a note`, actor);
    await audit(actor, {
      action: "note.create",
      entityType: "investigation",
      entityId: inv.id,
      summary: `${actor.name} added a note to ${inv.caseNumber}`,
    });

    return created(note);
  },
);
