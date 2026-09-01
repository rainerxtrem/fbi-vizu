import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { can, rankLevel, RANK_LABELS, PERMISSIONS, type Rank } from "@/lib/rbac";
import { effectivePermissionsForRank } from "@/lib/rbac-store";
import { AGENT_STATUS } from "@/lib/constants";
import { PageTitle } from "@/components/agent/ui";
import { Breadcrumbs } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { RankControl } from "@/components/agent/rank-control";
import { PermissionOverrides } from "@/components/agent/permission-overrides";
import { AgentEditForm } from "@/components/agent/agent-edit-form";
import { formatDate, formatDateTime } from "@/lib/format";

export default async function AgentDetailPage({ params }: { params: { id: string } }) {
  const actor = await requirePermission("agents.view");
  const agent = await prisma.agent.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      fieldOffice: true,
      rankChanges: {
        include: { changedBy: { include: { user: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!agent) notFound();

  const canManageAgent = can(actor, "agents.manage");
  const [offices, stats] = await Promise.all([
    canManageAgent
      ? prisma.fieldOffice.findMany({ orderBy: { isHq: "desc" } })
      : Promise.resolve([]),
    (async () => {
      const [led, ledClosed, assigned, arrests, warrantsReq, warrantsApproved, evidence] =
        await Promise.all([
          prisma.investigation.count({ where: { deletedAt: null, leadAgentId: agent.id } }),
          prisma.investigation.count({
            where: {
              deletedAt: null,
              leadAgentId: agent.id,
              status: { in: ["CLOSED", "ARCHIVED"] },
            },
          }),
          prisma.investigationAgent.count({ where: { agentId: agent.id } }),
          prisma.arrest.count({ where: { arrestingAgentId: agent.id } }),
          prisma.warrant.count({ where: { requestedById: agent.id } }),
          prisma.warrant.count({ where: { approvedById: agent.id } }),
          prisma.evidence.count({ where: { deletedAt: null, collectedById: agent.id } }),
        ]);
      return { led, ledClosed, assigned, arrests, warrantsReq, warrantsApproved, evidence };
    })(),
  ]);
  const closeRate = stats.led > 0 ? Math.round((stats.ledClosed / stats.led) * 100) : null;

  const canManageRank =
    (can(actor, "agents.promote") || can(actor, "agents.demote")) &&
    actor.agent != null &&
    (actor.agent.rank === "DIRECTOR" ||
      rankLevel(agent.rank as Rank) < rankLevel(actor.agent.rank as Rank));
  const maxLevel = actor.agent?.rank === "DIRECTOR" ? -1 : rankLevel(actor.agent?.rank as Rank);

  const effSet =
    agent.rank === "DIRECTOR"
      ? new Set(PERMISSIONS)
      : await effectivePermissionsForRank(agent.rank as Rank);
  if (agent.status === "ACTIVE" && agent.rank !== "DIRECTOR") {
    for (const g of agent.permissionGrants) effSet.add(g as (typeof PERMISSIONS)[number]);
    for (const r of agent.permissionRevokes) effSet.delete(r as (typeof PERMISSIONS)[number]);
  } else if (agent.status !== "ACTIVE" && agent.rank !== "DIRECTOR") {
    effSet.clear();
  }
  const eff = Array.from(effSet).sort();

  return (
    <div>
      <Breadcrumbs items={[{ label: "Agents", href: "/agent/agents" }, { label: agent.user.name }]} />
      <PageTitle
        title={agent.user.name}
        subtitle={`${RANK_LABELS[agent.rank as Rank]} · ${agent.badgeNumber}`}
        action={<Badge tone={agent.status === "ACTIVE" ? "green" : "amber"}>{AGENT_STATUS[agent.status] ?? agent.status}</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Affectation" />
          <CardBody className="space-y-2 text-sm">
            <Row label="Fonction" value={agent.title} />
            <Row label="Division" value={agent.division} />
            <Row label="Unité" value={agent.unit} />
            <Row label="Field Office" value={agent.fieldOffice?.name} />
            <Row label="E-mail" value={agent.user.email} />
            <Row label="Téléphone" value={agent.phone} />
            <Row label="Date d'entrée en service" value={formatDate(agent.hireDate)} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Permissions effectives" description={`${eff.length} permissions (grade + dérogations)`} />
          <CardBody>
            <div className="flex max-h-56 flex-wrap gap-1.5 overflow-y-auto">
              {eff.map((p) => (
                <span key={p} className="rounded bg-navy-100 px-1.5 py-0.5 font-mono text-[11px] text-navy-600">
                  {p}
                </span>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Statistiques" description="Activité de l'agent" />
          <CardBody>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <Stat label="Dossiers dirigés" value={stats.led} />
              <Stat
                label="Taux de clôture"
                value={closeRate === null ? "—" : `${closeRate}%`}
              />
              <Stat label="Dossiers affectés" value={stats.assigned} />
              <Stat label="Arrestations" value={stats.arrests} />
              <Stat label="Mandats demandés" value={stats.warrantsReq} />
              <Stat label="Mandats approuvés" value={stats.warrantsApproved} />
              <Stat label="Preuves collectées" value={stats.evidence} />
            </div>
          </CardBody>
        </Card>

        {canManageAgent ? (
          <Card className="lg:col-span-2">
            <CardHeader title="Modifier l'agent" description="Affectation, statut et coordonnées" />
            <CardBody>
              <AgentEditForm
                agentId={agent.id}
                offices={offices.map((o) => ({ id: o.id, label: o.name }))}
                initial={{
                  title: agent.title,
                  division: agent.division,
                  unit: agent.unit,
                  status: agent.status,
                  fieldOfficeId: agent.fieldOfficeId,
                  phone: agent.phone,
                }}
              />
            </CardBody>
          </Card>
        ) : null}

        {canManageRank ? (
          <Card>
            <CardHeader title="Gestion du grade" />
            <CardBody>
              <RankControl agentId={agent.id} currentRank={agent.rank as Rank} maxLevel={maxLevel} />
            </CardBody>
          </Card>
        ) : null}

        {can(actor, "system.manage") ? (
          <Card>
            <CardHeader title="Dérogations de permissions (Admin)" />
            <CardBody>
              <PermissionOverrides
                agentId={agent.id}
                grants={agent.permissionGrants}
                revokes={agent.permissionRevokes}
              />
            </CardBody>
          </Card>
        ) : null}

        <Card className="lg:col-span-2">
          <CardHeader title="Historique des grades" />
          <CardBody className="p-0">
            {agent.rankChanges.length === 0 ? (
              <p className="px-5 py-4 text-sm text-navy-500">Aucun changement de grade enregistré.</p>
            ) : (
              <ul className="divide-y divide-navy-100 text-sm">
                {agent.rankChanges.map((rc) => (
                  <li key={rc.id} className="px-5 py-3">
                    <p className="text-navy-800">
                      {RANK_LABELS[rc.oldRank as Rank]} → {RANK_LABELS[rc.newRank as Rank]}
                    </p>
                    <p className="text-xs text-navy-400">
                      {formatDateTime(rc.createdAt)} · par {rc.changedBy?.user.name ?? "système"}
                      {rc.reason ? ` · ${rc.reason}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-xs uppercase tracking-wide text-navy-400">{label}</span>
      <span className="text-right text-navy-800">{value || "—"}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-2xl font-bold text-navy-900">{value}</p>
      <p className="text-xs uppercase tracking-wide text-navy-400">{label}</p>
    </div>
  );
}
