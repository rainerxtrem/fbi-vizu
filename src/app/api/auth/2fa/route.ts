export const dynamic = "force-dynamic";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { handle, ok, fail, assertRateLimit } from "@/lib/api";
import { requireApiActor } from "@/lib/auth";
import { createSession } from "@/lib/session";
import { verifyPassword } from "@/lib/password";
import { generateSecret, verifyTotp, otpauthUri } from "@/lib/totp";
import { audit } from "@/lib/audit";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("begin") }),
  z.object({ action: z.literal("enable"), code: z.string().trim().min(6).max(6) }),
  z.object({
    action: z.literal("disable"),
    password: z.string().min(1).max(200),
    code: z.string().trim().min(6).max(6),
  }),
]);

export const POST = handle(async (req: Request) => {
  assertRateLimit(req, "2fa", 15, 60_000);
  const actor = await requireApiActor();
  const input = schema.parse(await req.json());

  const user = await prisma.user.findUnique({ where: { id: actor.userId } });
  if (!user) return fail("Compte introuvable.", 404);

  if (input.action === "begin") {
    if (user.totpEnabledAt) return fail("La double authentification est déjà active.", 400);
    const secret = generateSecret();
    await prisma.user.update({ where: { id: user.id }, data: { totpSecret: secret } });
    return ok({ secret, uri: otpauthUri(secret, user.email) });
  }

  if (input.action === "enable") {
    if (user.totpEnabledAt) return fail("Déjà active.", 400);
    if (!user.totpSecret) return fail("Commencez d'abord la configuration.", 400);
    if (!verifyTotp(user.totpSecret, input.code)) {
      return fail("Code incorrect. Vérifiez l'heure de votre téléphone.", 400);
    }
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { totpEnabledAt: new Date(), tokenVersion: { increment: 1 } },
    });
    await createSession({
      sub: updated.id,
      email: updated.email,
      name: updated.name,
      ver: updated.tokenVersion,
    });
    await audit(actor, {
      action: "auth.2fa.enable",
      entityType: "user",
      entityId: user.id,
      summary: `${actor.name} a activé la double authentification`,
    });
    return ok({ enabled: true });
  }

  // disable
  if (!user.totpEnabledAt || !user.totpSecret) return fail("La 2FA n'est pas active.", 400);
  if (!(await verifyPassword(input.password, user.passwordHash))) {
    return fail("Mot de passe incorrect.", 403);
  }
  if (!verifyTotp(user.totpSecret, input.code)) return fail("Code incorrect.", 400);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { totpEnabledAt: null, totpSecret: null, tokenVersion: { increment: 1 } },
  });
  await createSession({
    sub: updated.id,
    email: updated.email,
    name: updated.name,
    ver: updated.tokenVersion,
  });
  await audit(actor, {
    action: "auth.2fa.disable",
    entityType: "user",
    entityId: user.id,
    summary: `${actor.name} a désactivé la double authentification`,
  });
  return ok({ disabled: true });
});
