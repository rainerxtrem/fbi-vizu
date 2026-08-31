import { prisma } from "@/lib/db";
import { handle, ok, fail } from "@/lib/api";
import { agentUpdateSchema } from "@/lib/validation";
import { requireApiActor } from "@/lib/auth";
import { can, PERMISSIONS } from "@/lib/rbac";
import { audit } from "@/lib/audit";

export const PATCH = handle(
  async (req: Request, { params }: { params: { id: string } }) => {
    const actor = await requireApiActor();
    const d = agentUpdateSchema.parse(await req.json());

    const agent = await prisma.agent.findUnique({
      where: { id: params.id },
      include: { user: true },
    });
    if (!agent) return fail("Agent not found.", 404);

    // Permission overrides are a technical (Admin) capability.
    const touchingOverrides =
      d.permissionGrants !== undefined || d.permissionRevokes !== undefined;
    if (touchingOverrides && !can(actor, "system.manage")) {
      return fail("Only a platform Admin may edit permission overrides.", 403);
    }
    if (!touchingOverrides && !can(actor, "agents.manage")) {
      return fail("Missing permission: agents.manage", 403);
    }

    const validPerm = (p: string) => (PERMISSIONS as readonly string[]).includes(p);

    const updated = await prisma.agent.update({
      where: { id: agent.id },
      data: {
        title: d.title ?? undefined,
        division: d.division ?? undefined,
        unit: d.unit ?? undefined,
        status: d.status ?? undefined,
        fieldOfficeId: d.fieldOfficeId || undefined,
        phone: d.phone ?? undefined,
        permissionGrants: d.permissionGrants
          ? d.permissionGrants.filter(validPerm)
          : undefined,
        permissionRevokes: d.permissionRevokes
          ? d.permissionRevokes.filter(validPerm)
          : undefined,
      },
    });

    await audit(actor, {
      action: "agent.update",
      entityType: "agent",
      entityId: agent.id,
      summary: `${actor.name} updated agent ${agent.user.name} (${agent.badgeNumber})`,
      meta: { fields: Object.keys(d) },
    });

    return ok(updated);
  },
);
