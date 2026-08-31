import Link from "next/link";
import { requireAgent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { can } from "@/lib/rbac";
import { investigationVisibilityFilter } from "@/lib/rbac";
import { PageTitle, StatCard } from "@/components/agent/ui";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { StatusPie, CategoryBar, TrendLine } from "@/components/agent/charts";
import { ButtonLink } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { INVESTIGATION_STATUS } from "@/lib/constants";

export default async function AgentDashboard() {
  const actor = await requireAgent();
  const visFilter = investigationVisibilityFilter(actor);
  const agentId = actor.agent?.id ?? "__none__";

  const [
    activeInv,
    openInv,
    highPriority,
    mostWanted,
    pendingApps,
    unreadTips,
    evidenceItems,
    activeWarrants,
    byStatus,
    recentAudit,
    myCases,
  ] = await Promise.all([
    prisma.investigation.count({ where: { AND: [visFilter, { status: "ACTIVE" }] } }),
    prisma.investigation.count({ where: { AND: [visFilter, { status: "OPEN" }] } }),
    prisma.investigation.count({
      where: { AND: [visFilter, { priority: { in: ["HIGH", "CRITICAL"] } }, { status: { in: ["OPEN", "ACTIVE"] } }] },
    }),
    prisma.mostWanted.count({ where: { status: "PUBLISHED" } }),
    can(actor, "applications.view")
      ? prisma.application.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } })
      : 0,
    can(actor, "tips.view")
      ? prisma.tip.count({
          where: can(actor, "tips.view.all")
            ? { status: "NEW" }
            : { status: "NEW", OR: [{ assignedToId: agentId }, { investigation: { leadAgentId: agentId } }] },
        })
      : 0,
    prisma.evidence.count(),
    prisma.warrant.count({ where: { status: { in: ["APPROVED", "ACTIVE"] } } }),
    prisma.investigation.groupBy({
      by: ["status"],
      _count: true,
      where: visFilter,
    }),
    can(actor, "audit.view")
      ? prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 })
      : [],
    prisma.investigation.findMany({
      where: {
        OR: [
          { leadAgentId: agentId },
          { assignedAgents: { some: { agentId } } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { leadAgent: { include: { user: true } } },
    }),
  ]);

  // charts
  const statusData = ["OPEN", "ACTIVE", "SUSPENDED", "CLOSED", "ARCHIVED"].map((s) => ({
    name: INVESTIGATION_STATUS[s].label,
    value: byStatus.find((b) => b.status === s)?._count ?? 0,
  }));

  const priorityGroups = await prisma.investigation.groupBy({
    by: ["priority"],
    _count: true,
    where: visFilter,
  });
  const priorityData = ["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((p) => ({
    name: p[0] + p.slice(1).toLowerCase(),
    value: priorityGroups.find((g) => g.priority === p)?._count ?? 0,
  }));

  const trend = await buildTrend(visFilter);

  return (
    <div>
      <PageTitle
        title={`Welcome back, ${actor.name}`}
        subtitle={
          actor.agent
            ? `${actor.agent.title} · ${actor.agent.fieldOfficeName ?? "Headquarters"}`
            : "Platform Administrator"
        }
        action={
          can(actor, "investigation.create") ? (
            <ButtonLink href="/agent/investigations/new" size="sm">
              + Create Investigation
            </ButtonLink>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Investigations" value={activeInv} href="/agent/investigations?status=ACTIVE" />
        <StatCard label="Open Cases" value={openInv} href="/agent/investigations?status=OPEN" />
        <StatCard label="High Priority Cases" value={highPriority} tone="red" href="/agent/investigations?priority=HIGH" />
        <StatCard label="Published Most Wanted" value={mostWanted} href="/agent/most-wanted" />
        <StatCard label="Pending Applications" value={pendingApps} tone="amber" href="/agent/applications" />
        <StatCard label="Unread Tips" value={unreadTips} tone="amber" href="/agent/tips" />
        <StatCard label="Evidence Items" value={evidenceItems} />
        <StatCard label="Active Warrants" value={activeWarrants} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Investigations by Status" />
          <CardBody>
            <StatusPie data={statusData} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Investigations by Priority" />
          <CardBody>
            <CategoryBar data={priorityData} />
          </CardBody>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="Cases opened vs. closed (last 6 months)" />
          <CardBody>
            <TrendLine data={trend} />
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="My recent investigations"
            action={<Link href="/agent/investigations/mine" className="text-xs font-semibold uppercase text-navy-600">View all</Link>}
          />
          <CardBody className="p-0">
            {myCases.length === 0 ? (
              <p className="px-5 py-6 text-sm text-navy-500">
                You are not assigned to any investigations yet.
              </p>
            ) : (
              <ul className="divide-y divide-navy-100">
                {myCases.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/agent/investigations/${c.id}`}
                      className="flex items-center justify-between px-5 py-3 hover:bg-navy-50"
                    >
                      <span>
                        <span className="font-mono text-xs text-navy-400">{c.caseNumber}</span>
                        <span className="block text-sm font-medium text-navy-900">{c.title}</span>
                      </span>
                      <span className="text-xs text-navy-500">
                        {INVESTIGATION_STATUS[c.status]?.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {can(actor, "audit.view") ? (
          <Card>
            <CardHeader
              title="Recent activity"
              action={<Link href="/agent/activity" className="text-xs font-semibold uppercase text-navy-600">Audit log</Link>}
            />
            <CardBody className="p-0">
              <ul className="divide-y divide-navy-100">
                {recentAudit.map((a) => (
                  <li key={a.id} className="px-5 py-3 text-sm">
                    <p className="text-navy-800">{a.summary}</p>
                    <p className="text-xs text-navy-400">
                      {a.actorLabel} · {formatDateTime(a.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

async function buildTrend(visFilter: object) {
  const now = new Date();
  const months: { month: string; opened: number; closed: number; start: Date; end: Date }[] = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    months.push({
      month: start.toLocaleString("en-US", { month: "short" }),
      opened: 0,
      closed: 0,
      start,
      end,
    });
  }
  await Promise.all(
    months.map(async (m) => {
      m.opened = await prisma.investigation.count({
        where: { AND: [visFilter, { openedAt: { gte: m.start, lt: m.end } }] },
      });
      m.closed = await prisma.investigation.count({
        where: { AND: [visFilter, { closedAt: { gte: m.start, lt: m.end } }] },
      });
    }),
  );
  return months.map((m) => ({ month: m.month, opened: m.opened, closed: m.closed }));
}
