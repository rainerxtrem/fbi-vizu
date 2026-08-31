import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { readSession } from "./session";
import type { Actor, Permission, Rank } from "./rbac";
import { can, RbacError } from "./rbac";

/**
 * Loads the current Actor (user + agent profile) from the session cookie.
 * Cached per-request. Returns null for anonymous visitors.
 */
export const getActor = cache(async (): Promise<Actor | null> => {
  const session = await readSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: { agent: { include: { fieldOffice: true } } },
  });
  if (!user) return null;

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
    agent: user.agent
      ? {
          id: user.agent.id,
          badgeNumber: user.agent.badgeNumber,
          rank: user.agent.rank as Rank,
          title: user.agent.title,
          division: user.agent.division,
          unit: user.agent.unit,
          status: user.agent.status,
          fieldOfficeId: user.agent.fieldOfficeId,
          fieldOfficeName: user.agent.fieldOffice?.name ?? null,
          permissionGrants: user.agent.permissionGrants,
          permissionRevokes: user.agent.permissionRevokes,
        }
      : null,
  };
});

/** Server-component guard: require an authenticated agent or admin. */
export async function requireAgent(): Promise<Actor> {
  const actor = await getActor();
  if (!actor) redirect("/agent/login");
  if (!actor.agent && !actor.isAdmin) redirect("/agent/login?error=not_an_agent");
  return actor;
}

/** Server-component guard: require a specific permission. */
export async function requirePermission(permission: Permission): Promise<Actor> {
  const actor = await requireAgent();
  if (!can(actor, permission)) redirect("/agent?error=forbidden");
  return actor;
}

/** API-route guard: throws RbacError (mapped to 401/403) instead of redirecting. */
export async function requireApiActor(): Promise<Actor> {
  const actor = await getActor();
  if (!actor) {
    const e = new RbacError("Authentication required");
    e.status = 401;
    throw e;
  }
  return actor;
}

export async function requireApiPermission(permission: Permission): Promise<Actor> {
  const actor = await requireApiActor();
  if (!can(actor, permission)) throw new RbacError(`Missing permission: ${permission}`);
  return actor;
}
