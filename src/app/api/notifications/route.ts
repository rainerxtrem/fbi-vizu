export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { handle, ok, fail } from "@/lib/api";
import { requireApiActor } from "@/lib/auth";

export const GET = handle(async () => {
  const actor = await requireApiActor();
  if (!actor.agent) return ok({ notifications: [], unread: 0 });

  const [notifications, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { agentId: actor.agent.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.notification.count({ where: { agentId: actor.agent.id, readAt: null } }),
  ]);

  return ok({ notifications, unread });
});

export const POST = handle(async (req: Request) => {
  const actor = await requireApiActor();
  if (!actor.agent) return fail("Réservé aux agents.", 403);

  const body = await req.json().catch(() => ({}));
  if (body.all) {
    await prisma.notification.updateMany({
      where: { agentId: actor.agent.id, readAt: null },
      data: { readAt: new Date() },
    });
    return ok({ done: true });
  }
  if (typeof body.id === "string") {
    await prisma.notification.updateMany({
      where: { id: body.id, agentId: actor.agent.id },
      data: { readAt: new Date() },
    });
    return ok({ done: true });
  }
  return fail("Requête invalide.", 400);
});
