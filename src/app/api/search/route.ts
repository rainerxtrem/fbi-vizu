import { prisma } from "@/lib/db";
import { handle, ok } from "@/lib/api";
import { requireApiActor } from "@/lib/auth";
import { investigationVisibilityFilter, can } from "@/lib/rbac";

export const GET = handle(async (req: Request) => {
  const actor = await requireApiActor();
  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q || q.length < 2) return ok({ groups: [] });

  const like = { contains: q, mode: "insensitive" as const };

  const [investigations, suspects, mostWanted, evidence, agents, tips, applications, news] =
    await Promise.all([
      prisma.investigation.findMany({
        where: {
          AND: [
            investigationVisibilityFilter(actor),
            { OR: [{ title: like }, { caseNumber: like }, { description: like }] },
          ],
        },
        take: 8,
        select: { id: true, title: true, caseNumber: true, status: true },
      }),
      can(actor, "suspect.view")
        ? prisma.person.findMany({
            where: { OR: [{ fullName: like }, { alias: like }, { description: like }] },
            take: 8,
            select: { id: true, fullName: true, alias: true, riskLevel: true },
          })
        : [],
      can(actor, "mostwanted.view")
        ? prisma.mostWanted.findMany({
            where: { OR: [{ fullName: like }, { aliases: like }, { publicId: like }] },
            take: 8,
            select: { id: true, fullName: true, publicId: true, status: true },
          })
        : [],
      can(actor, "evidence.view")
        ? prisma.evidence.findMany({
            where: { OR: [{ title: like }, { evidenceNumber: like }, { description: like }] },
            take: 8,
            select: { id: true, title: true, evidenceNumber: true, investigationId: true },
          })
        : [],
      can(actor, "agents.view")
        ? prisma.agent.findMany({
            where: { OR: [{ badgeNumber: like }, { user: { name: like } }] },
            take: 8,
            include: { user: true },
          })
        : [],
      can(actor, "tips.view")
        ? prisma.tip.findMany({
            where: { OR: [{ subject: like }, { publicId: like }, { description: like }] },
            take: 8,
            select: { id: true, subject: true, publicId: true, status: true },
          })
        : [],
      can(actor, "applications.view")
        ? prisma.application.findMany({
            where: {
              OR: [{ firstName: like }, { lastName: like }, { publicId: like }, { email: like }],
            },
            take: 8,
            select: { id: true, firstName: true, lastName: true, publicId: true, status: true },
          })
        : [],
      can(actor, "news.view")
        ? prisma.news.findMany({
            where: { OR: [{ title: like }, { subtitle: like }] },
            take: 6,
            select: { id: true, title: true, slug: true, status: true },
          })
        : [],
    ]);

  const groups = [
    {
      label: "Investigations",
      items: investigations.map((i) => ({
        title: i.title,
        meta: `${i.caseNumber} · ${i.status}`,
        href: `/agent/investigations/${i.id}`,
      })),
    },
    {
      label: "Suspects & Persons",
      items: suspects.map((s) => ({
        title: s.fullName,
        meta: s.alias ? `“${s.alias}” · ${s.riskLevel}` : s.riskLevel,
        href: `/agent/suspects/${s.id}`,
      })),
    },
    {
      label: "Most Wanted",
      items: mostWanted.map((m) => ({
        title: m.fullName,
        meta: `${m.publicId} · ${m.status}`,
        href: `/agent/most-wanted/${m.id}`,
      })),
    },
    {
      label: "Evidence",
      items: evidence.map((e) => ({
        title: e.title,
        meta: `#${e.evidenceNumber}`,
        href: `/agent/investigations/${e.investigationId}`,
      })),
    },
    {
      label: "Agents",
      items: agents.map((a) => ({
        title: a.user.name,
        meta: `${a.badgeNumber} · ${a.rank}`,
        href: `/agent/agents/${a.id}`,
      })),
    },
    {
      label: "Tips",
      items: tips.map((t) => ({
        title: t.subject,
        meta: `${t.publicId} · ${t.status}`,
        href: `/agent/tips`,
      })),
    },
    {
      label: "Applications",
      items: applications.map((a) => ({
        title: `${a.firstName} ${a.lastName}`,
        meta: `${a.publicId} · ${a.status}`,
        href: `/agent/applications`,
      })),
    },
    {
      label: "News",
      items: news.map((n) => ({
        title: n.title,
        meta: n.status,
        href: `/agent/news`,
      })),
    },
  ].filter((g) => g.items.length > 0);

  return ok({ groups });
});
