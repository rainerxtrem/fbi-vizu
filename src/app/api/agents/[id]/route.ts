export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { handle, ok, fail } from "@/lib/api";
import { agentUpdateSchema } from "@/lib/validation";
import { requireApiActor } from "@/lib/auth";
import { can, PERMISSIONS, rankLevel, type Rank } from "@/lib/rbac";
import { audit } from "@/lib/audit";

export const PATCH = handle(
  async (req: Request, { params }: { params: { id: string } }) => {
    const actor = await requireApiActor();
    const d = agentUpdateSchema.parse(await req.json());

    const agent = await prisma.agent.findUnique({
      where: { id: params.id },
      include: { user: true },
    });
    if (!agent) return fail("Agent introuvable.", 404);

    // Permission overrides are a technical (Admin / Director) capability.
    const touchingOverrides =
      d.permissionGrants !== undefined || d.permissionRevokes !== undefined;
    if (touchingOverrides && !can(actor, "system.manage")) {
      return fail(
        "Seul un Admin de la plateforme ou le Director peut modifier les dérogations de permissions.",
        403,
      );
    }
    if (!touchingOverrides && !can(actor, "agents.manage")) {
      return fail("Permission manquante : agents.manage", 403);
    }

    // A non-Director may only manage agents strictly below their own rank, and
    // may never lock themselves out.
    const me = actor.agent;
    const isDirector = me?.rank === "DIRECTOR";
    if (me && !isDirector) {
      if (agent.id === me.id && (d.status && d.status !== "ACTIVE")) {
        return fail("Vous ne pouvez pas modifier votre propre statut.", 403);
      }
      if (rankLevel(agent.rank as Rank) >= rankLevel(me.rank as Rank) && agent.id !== me.id) {
        return fail(
          "Vous ne pouvez gérer que des Agents d'un grade inférieur au vôtre.",
          403,
        );
      }
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
      summary: `${actor.name} a mis à jour l'Agent ${agent.user.name} (${agent.badgeNumber})`,
      meta: { fields: Object.keys(d) },
    });

    return ok(updated);
  },
);
