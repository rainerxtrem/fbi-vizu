import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/session";
import { loginSchema } from "@/lib/validation";
import { handle, fail, ok, assertRateLimit, clientIp } from "@/lib/api";
import { audit } from "@/lib/audit";

export const POST = handle(async (req: Request) => {
  assertRateLimit(req, "login", 8, 60_000);
  const body = await req.json();
  const { email, password } = loginSchema.parse(body);

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { agent: true },
  });

  // constant-ish time: always run a compare
  const hash = user?.passwordHash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidin";
  const valid = await verifyPassword(password, hash);

  if (!user || !valid) {
    await audit(null, {
      action: "auth.login.failed",
      summary: `Failed login attempt for ${email}`,
      ip: clientIp(req),
    });
    return fail("Invalid email or password.", 401);
  }

  if (user.agent && user.agent.status === "SUSPENDED") {
    return fail("This account is suspended. Contact the platform administrator.", 403);
  }

  await createSession({ sub: user.id, email: user.email, name: user.name });
  await audit(
    { userId: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin, agent: null },
    { action: "auth.login", summary: `${user.name} signed in`, ip: clientIp(req) },
  );

  return ok({ id: user.id, name: user.name, isAdmin: user.isAdmin, isAgent: !!user.agent });
});

export function GET() {
  return NextResponse.json({ ok: false, error: "Method not allowed" }, { status: 405 });
}
