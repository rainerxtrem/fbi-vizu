import { prisma } from "@/lib/db";
import { handle, ok, fail } from "@/lib/api";
import { applicationUpdateSchema } from "@/lib/validation";
import { requireApiActor } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";

export const PATCH = handle(
  async (req: Request, { params }: { params: { id: string } }) => {
    const actor = await requireApiActor();
    if (!can(actor, "applications.review")) {
      return fail("Missing permission: applications.review", 403);
    }
    const d = applicationUpdateSchema.parse(await req.json());

    const app = await prisma.application.findUnique({ where: { id: params.id } });
    if (!app) return fail("Application not found.", 404);

    // Approve / reject require elevated permission
    if (
      (d.status === "APPROVED" && !can(actor, "applications.approve")) ||
      (d.status === "REJECTED" && !can(actor, "applications.reject"))
    ) {
      return fail("You are not authorized to make this decision.", 403);
    }

    const updated = await prisma.application.update({
      where: { id: params.id },
      data: {
        status: d.status ?? undefined,
        assignedRecruiterId: d.assignedRecruiterId || undefined,
        notes: d.notes ?? undefined,
        interviewNotes: d.interviewNotes ?? undefined,
        backgroundCheckNotes: d.backgroundCheckNotes ?? undefined,
        decision: d.decision ?? undefined,
        decidedById:
          d.status === "APPROVED" || d.status === "REJECTED"
            ? actor.agent?.id ?? undefined
            : undefined,
      },
    });

    await audit(actor, {
      action: "application.updated",
      entityType: "application",
      entityId: app.id,
      summary: `${actor.name} updated application ${app.publicId}${
        d.status ? ` → ${d.status}` : ""
      }`,
      meta: { status: d.status },
    });

    return ok(updated);
  },
);
