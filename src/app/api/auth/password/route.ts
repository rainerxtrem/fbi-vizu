export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { handle, ok, fail, assertRateLimit } from "@/lib/api";
import { requireApiActor } from "@/lib/auth";
import { passwordChangeSchema } from "@/lib/validation";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/session";
import { audit } from "@/lib/audit";

export const POST = handle(async (req: Request) => {
  assertRateLimit(req, "password-change", 5, 60_000);
  const actor = await requireApiActor();
  const { currentPassword, newPassword } = passwordChangeSchema.parse(await req.json());

  const user = await prisma.user.findUnique({ where: { id: actor.userId } });
  if (!user) return fail("Compte introuvable.", 404);

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) return fail("Le mot de passe actuel est incorrect.", 403);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(newPassword),
      passwordChangedAt: new Date(),
      tokenVersion: { increment: 1 },
    },
  });

  // Keep the caller signed in on this device; every other session is now invalid.
  await createSession({
    sub: updated.id,
    email: updated.email,
    name: updated.name,
    ver: updated.tokenVersion,
  });

  await audit(actor, {
    action: "auth.password.change",
    entityType: "user",
    entityId: user.id,
    summary: `${actor.name} a changé son mot de passe (autres sessions révoquées)`,
  });

  return ok({ changed: true });
});
