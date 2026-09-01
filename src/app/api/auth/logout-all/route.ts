export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { destroySession } from "@/lib/session";
import { requireApiActor } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { handle } from "@/lib/api";

export const POST = handle(async () => {
  const actor = await requireApiActor();
  await prisma.user.update({
    where: { id: actor.userId },
    data: { tokenVersion: { increment: 1 } },
  });
  await audit(actor, {
    action: "auth.logout.all",
    entityType: "user",
    entityId: actor.userId,
    summary: `${actor.name} a révoqué toutes ses sessions`,
  });
  destroySession();
  return NextResponse.json({ ok: true });
});
