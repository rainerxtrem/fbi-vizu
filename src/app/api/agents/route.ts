export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { handle, created, fail, assertRateLimit } from "@/lib/api";
import { agentCreateSchema } from "@/lib/validation";
import { requireApiPermission } from "@/lib/auth";
import { rankLevel, type Rank } from "@/lib/rbac";
import { hashPassword, randomPassword } from "@/lib/password";
import { nextBadgeNumber } from "@/lib/ids";
import { audit } from "@/lib/audit";
import { sendEmail, agentWelcomeEmail } from "@/lib/email";

export const POST = handle(async (req: Request) => {
  assertRateLimit(req, "agent-create", 10, 60_000);
  const actor = await requireApiPermission("agents.manage");
  const d = agentCreateSchema.parse(await req.json());

  const me = actor.agent;
  const isDirector = me?.rank === "DIRECTOR";

  if (me && !isDirector && rankLevel(d.rank as Rank) >= rankLevel(me.rank)) {
    return fail("Vous ne pouvez recruter qu'un Agent d'un grade inférieur au vôtre.", 403);
  }
  if (d.isAdmin && !(actor.isAdmin || isDirector)) {
    return fail("Seul un Admin de la plateforme ou le Director peut accorder le rôle administrateur.", 403);
  }

  const email = d.email.toLowerCase();
  if (await prisma.user.findUnique({ where: { email } })) {
    return fail("Un compte existe déjà avec cette adresse e-mail.", 409);
  }

  let application: { id: string; decision: string | null } | null = null;
  if (d.applicationId) {
    const app = await prisma.application.findUnique({
      where: { id: d.applicationId },
      include: { hiredAgent: true },
    });
    if (!app) return fail("Candidature introuvable.", 404);
    if (app.hiredAgent) return fail("Cette candidature a déjà donné lieu à un recrutement.", 409);
    application = { id: app.id, decision: app.decision };
  }

  const badgeNumber = d.badgeNumber?.trim() || (await nextBadgeNumber());
  if (await prisma.agent.findUnique({ where: { badgeNumber } })) {
    return fail("Ce matricule est déjà attribué.", 409);
  }

  const generated = d.password ? null : randomPassword();
  const user = await prisma.user.create({
    data: {
      email,
      name: d.name,
      isAdmin: d.isAdmin,
      passwordHash: await hashPassword(d.password ?? generated!),
      agent: {
        create: {
          badgeNumber,
          rank: d.rank,
          title: d.title,
          division: d.division,
          unit: d.unit ?? null,
          phone: d.phone ?? null,
          fieldOfficeId: d.fieldOfficeId || null,
          hireDate: d.hireDate ? new Date(d.hireDate) : new Date(),
          applicationId: application?.id ?? null,
        },
      },
    },
    include: { agent: true },
  });

  if (application) {
    await prisma.application.update({
      where: { id: application.id },
      data: {
        status: "APPROVED",
        decidedById: actor.agent?.id ?? null,
        decision: application.decision ?? `Recruté — matricule ${badgeNumber}`,
      },
    });
  }

  await audit(actor, {
    action: "agent.create",
    entityType: "agent",
    entityId: user.agent!.id,
    summary: `${actor.name} a recruté l'Agent ${d.name} (${badgeNumber}, ${d.rank})${
      application ? " depuis une candidature" : ""
    }`,
    meta: { rank: d.rank, isAdmin: d.isAdmin, applicationId: application?.id },
  });

  const mail = agentWelcomeEmail(d.name, badgeNumber, generated);
  await sendEmail(email, mail.subject, mail.title, mail.body);

  return created({
    agentId: user.agent!.id,
    badgeNumber,
    email,
    tempPassword: generated ?? undefined,
  });
});
