import { handle, created, fail } from "@/lib/api";
import { timelineEventSchema } from "@/lib/validation";
import { requireApiPermission } from "@/lib/auth";
import { getInvestigationOr404 } from "@/lib/access";
import { addTimelineEvent } from "@/lib/timeline";
import { audit } from "@/lib/audit";

export const POST = handle(
  async (req: Request, { params }: { params: { id: string } }) => {
    const actor = await requireApiPermission("timeline.create");
    const inv = await getInvestigationOr404(params.id, actor);
    if (!actor.agent) return fail("Agents only.", 403);
    const d = timelineEventSchema.parse(await req.json());

    await addTimelineEvent(
      inv.id,
      "CUSTOM",
      d.message,
      actor,
      d.occurredAt ? new Date(d.occurredAt) : undefined,
    );
    await audit(actor, {
      action: "timeline.create",
      entityType: "investigation",
      entityId: inv.id,
      summary: `${actor.name} added a timeline entry to ${inv.caseNumber}`,
    });

    return created({ ok: true });
  },
);
