export const dynamic = "force-dynamic";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { handle, ok, fail } from "@/lib/api";
import { requireApiPermission } from "@/lib/auth";
import { PERMISSIONS, RANK_ORDER, RANK_LABELS, type Rank } from "@/lib/rbac";
import { bustRoleOverrides, roleMatrix } from "@/lib/rbac-store";
import { audit } from "@/lib/audit";

const bodySchema = z.object({
  rank: z.enum(RANK_ORDER as [Rank, ...Rank[]]),
  permission: z.enum(PERMISSIONS as unknown as [string, ...string[]]),
  value: z.enum(["grant", "revoke", "default"]),
});

export const GET = handle(async () => {
  await requireApiPermission("system.manage");
  return ok({ matrix: await roleMatrix() });
});

export const PUT = handle(async (req: Request) => {
  const actor = await requireApiPermission("system.manage");
  const { rank, permission, value } = bodySchema.parse(await req.json());

  if (rank === "DIRECTOR") {
    return fail("Le grade Director conserve tous les accès sans exception.", 400);
  }

  if (value === "default") {
    await prisma.rolePermissionOverride.deleteMany({ where: { rank, permission } });
  } else {
    await prisma.rolePermissionOverride.upsert({
      where: { rank_permission: { rank, permission } },
      create: { rank, permission, granted: value === "grant", updatedById: actor.agent?.id ?? null },
      update: { granted: value === "grant", updatedById: actor.agent?.id ?? null },
    });
  }

  bustRoleOverrides();

  await audit(actor, {
    action: "role.permission.update",
    entityType: "role",
    entityId: rank,
    summary: `${actor.name} a ${
      value === "default" ? "réinitialisé" : value === "grant" ? "accordé" : "retiré"
    } « ${permission} » pour le grade ${RANK_LABELS[rank]}`,
    meta: { rank, permission, value },
  });

  return ok({ updated: true });
});

export const POST = handle(async (req: Request) => {
  // Reset an entire rank to code defaults.
  const actor = await requireApiPermission("system.manage");
  const { rank } = z
    .object({ rank: z.enum(RANK_ORDER as [Rank, ...Rank[]]) })
    .parse(await req.json());
  if (rank === "DIRECTOR") return fail("Rien à réinitialiser pour le grade Director.", 400);

  await prisma.rolePermissionOverride.deleteMany({ where: { rank } });
  bustRoleOverrides();
  await audit(actor, {
    action: "role.permission.reset",
    entityType: "role",
    entityId: rank,
    summary: `${actor.name} a réinitialisé toutes les permissions du grade ${RANK_LABELS[rank]}`,
  });
  return ok({ reset: true });
});
