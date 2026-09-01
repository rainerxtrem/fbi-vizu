import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { can, investigationVisibilityFilter } from "@/lib/rbac";
import { PageTitle, StatCard } from "@/components/agent/ui";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { StatusPie, CategoryBar, TrendLine } from "@/components/agent/charts";
import { INVESTIGATION_STATUS, PRIORITY } from "@/lib/constants";

export const dynamic = "force-dynamic";

function monthKey(d: Date) {
  return d.toLocaleString("fr-FR", { month: "short", year: "2-digit" });
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string };
}) {
  const actor = await requirePermission("reports.view");
  const global = can(actor, "reports.view.global");

  const now = new Date();
  const from = searchParams.from
    ? new Date(searchParams.from)
    : new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const to = searchParams.to ? new Date(`${searchParams.to}T23:59:59`) : now;

  const visFilter = investigationVisibilityFilter(actor);
  const inRange = { gte: from, lte: to };

  const [
    opened,
    closed,
    arrests,
    warrants,
    evidence,
    byStatus,
    byPriority,
    leadAgents,
  ] = await Promise.all([
    prisma.investigation.count({ where: { AND: [visFilter, { openedAt: inRange }] } }),
    prisma.investigation.count({ where: { AND: [visFilter, { closedAt: inRange }] } }),
    prisma.arrest.count({ where: { arrestDate: inRange } }),
    prisma.warrant.count({ where: { createdAt: inRange } }),
    prisma.evidence.count({ where: { collectedAt: inRange } }),
    prisma.investigation.groupBy({ by: ["status"], _count: true, where: visFilter }),
    prisma.investigation.groupBy({ by: ["priority"], _count: true, where: visFilter }),
    prisma.agent.findMany({
      where: { status: "ACTIVE", ledInvestigations: { some: {} } },
      select: {
        id: true,
        user: { select: { name: true } },
        _count: { select: { ledInvestigations: true, arrests: true } },
      },
    }),
  ]);

  // close rate per lead agent (needs a second pass for the "closed" subset)
  const closedByLead = await prisma.investigation.groupBy({
    by: ["leadAgentId"],
    _count: true,
    where: { deletedAt: null, status: { in: ["CLOSED", "ARCHIVED"] }, leadAgentId: { not: null } },
  });
  const closedMap = new Map(closedByLead.map((r) => [r.leadAgentId, r._count]));
  const agentRows = leadAgents
    .map((a) => {
      const led = a._count.ledInvestigations;
      const cl = closedMap.get(a.id) ?? 0;
      return {
        name: a.user.name,
        led,
        closed: cl,
        arrests: a._count.arrests,
        rate: led ? Math.round((cl / led) * 100) : 0,
      };
    })
    .sort((x, y) => y.led - x.led)
    .slice(0, 15);

  // arrests trend by month over the range
  const months: { month: string; opened: number; closed: number }[] = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), 1);
  while (cursor <= to && months.length < 24) {
    const s = new Date(cursor);
    const e = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    const [o, c] = await Promise.all([
      prisma.investigation.count({ where: { AND: [visFilter, { openedAt: { gte: s, lt: e } }] } }),
      prisma.investigation.count({ where: { AND: [visFilter, { closedAt: { gte: s, lt: e } }] } }),
    ]);
    months.push({ month: monthKey(s), opened: o, closed: c });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const statusData = ["OPEN", "ACTIVE", "SUSPENDED", "CLOSED", "ARCHIVED"].map((s) => ({
    name: INVESTIGATION_STATUS[s].label,
    value: byStatus.find((b) => b.status === s)?._count ?? 0,
  }));
  const priorityData = ["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((p) => ({
    name: PRIORITY[p].label,
    value: byPriority.find((b) => b.priority === p)?._count ?? 0,
  }));

  const fromStr = from.toISOString().slice(0, 10);
  const toStr = to.toISOString().slice(0, 10);

  return (
    <div>
      <PageTitle
        title="Rapports"
        subtitle={global ? "Toute l'agence" : "Votre périmètre"}
        action={
          <Link
            href={`/api/reports/export?from=${fromStr}&to=${toStr}`}
            className="rounded-md border border-navy-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-navy-700 hover:bg-navy-50"
          >
            Exporter en CSV
          </Link>
        }
      />

      <form className="mb-6 flex flex-wrap items-end gap-2" action="/agent/reports">
        <label className="text-sm">
          <span className="field-label">Du</span>
          <input name="from" type="date" defaultValue={fromStr} className="field-input" />
        </label>
        <label className="text-sm">
          <span className="field-label">Au</span>
          <input name="to" type="date" defaultValue={toStr} className="field-input" />
        </label>
        <button className="rounded-md bg-navy-800 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">
          Appliquer
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Dossiers ouverts" value={opened} />
        <StatCard label="Dossiers clôturés" value={closed} tone="green" />
        <StatCard label="Arrestations" value={arrests} />
        <StatCard label="Mandats émis" value={warrants} />
        <StatCard label="Preuves collectées" value={evidence} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Enquêtes par statut" />
          <CardBody>
            <StatusPie data={statusData} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Enquêtes par priorité" />
          <CardBody>
            <CategoryBar data={priorityData} />
          </CardBody>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="Ouvertures / clôtures sur la période" />
          <CardBody>
            <TrendLine data={months} />
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Activité par agent responsable" description="15 premiers, par nombre de dossiers dirigés" />
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-navy-200 bg-navy-50 text-left text-xs uppercase tracking-wide text-navy-500">
                  <th className="px-4 py-2">Agent</th>
                  <th className="px-4 py-2">Dossiers dirigés</th>
                  <th className="px-4 py-2">Clôturés</th>
                  <th className="px-4 py-2">Taux de clôture</th>
                  <th className="px-4 py-2">Arrestations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {agentRows.map((r) => (
                  <tr key={r.name}>
                    <td className="px-4 py-2 font-medium text-navy-900">{r.name}</td>
                    <td className="px-4 py-2 text-navy-700">{r.led}</td>
                    <td className="px-4 py-2 text-navy-700">{r.closed}</td>
                    <td className="px-4 py-2 text-navy-700">{r.rate}%</td>
                    <td className="px-4 py-2 text-navy-700">{r.arrests}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
