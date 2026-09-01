import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { can, investigationVisibilityFilter } from "@/lib/rbac";
import { PageTitle } from "@/components/agent/ui";
import { Breadcrumbs } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { TipControls, TipNotes } from "@/components/agent/tip-detail";
import { TIP_STATUS } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TipDetailPage({ params }: { params: { id: string } }) {
  const actor = await requirePermission("tips.view");
  const agentId = actor.agent?.id ?? "__none__";

  const tip = await prisma.tip.findUnique({
    where: { id: params.id },
    include: {
      mostWanted: true,
      investigation: { select: { id: true, caseNumber: true, title: true, leadAgentId: true } },
      assignedTo: { include: { user: true } },
      file: true,
      notes: { include: { author: { include: { user: true } } }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!tip) notFound();

  const mine =
    tip.assignedToId === agentId ||
    tip.investigation?.leadAgentId === agentId;
  if (!can(actor, "tips.view.all") && !mine) notFound();

  const canAssign = can(actor, "tips.assign");

  const [agents, investigations] = canAssign
    ? await Promise.all([
        prisma.agent.findMany({
          where: { status: "ACTIVE" },
          include: { user: true },
          orderBy: { user: { name: "asc" } },
        }),
        prisma.investigation.findMany({
          where: investigationVisibilityFilter(actor),
          orderBy: { updatedAt: "desc" },
          take: 100,
          select: { id: true, caseNumber: true, title: true },
        }),
      ])
    : [[], []];

  return (
    <div className="max-w-3xl">
      <Breadcrumbs
        items={[{ label: "Renseignements", href: "/agent/tips" }, { label: tip.publicId }]}
      />
      <PageTitle
        title={tip.subject}
        subtitle={`${tip.publicId} · reçu le ${formatDate(tip.createdAt)}`}
        action={
          <Badge tone={TIP_STATUS[tip.status]?.tone}>{TIP_STATUS[tip.status]?.label ?? tip.status}</Badge>
        }
      />

      <div className="space-y-6">
        <Card>
          <CardHeader title="Contenu" />
          <CardBody className="space-y-3 text-sm">
            <p className="whitespace-pre-line text-navy-800">{tip.description}</p>
            <div className="grid gap-2 border-t border-navy-100 pt-3 sm:grid-cols-2">
              <Row label="Auteur" value={tip.anonymous ? "Anonyme" : tip.name || "—"} />
              <Row label="E-mail" value={tip.anonymous ? "—" : tip.email || "—"} />
              <Row label="Téléphone" value={tip.anonymous ? "—" : tip.phone || "—"} />
              <Row label="Lieu" value={tip.location} />
              <Row
                label="Date de l'incident"
                value={tip.incidentDate ? formatDate(tip.incidentDate) : null}
              />
            </div>
            {tip.file ? (
              <a
                href={tip.file.url}
                target="_blank"
                className="inline-block text-sm font-semibold text-navy-700 underline"
              >
                Pièce jointe — {tip.file.originalName}
              </a>
            ) : null}
            {tip.mostWanted ? (
              <p>
                Lié au bulletin{" "}
                <Link href={`/agent/most-wanted/${tip.mostWanted.id}`} className="link-underline">
                  {tip.mostWanted.publicId}
                </Link>
              </p>
            ) : null}
            {tip.investigation ? (
              <p>
                Rattaché à l&apos;enquête{" "}
                <Link href={`/agent/investigations/${tip.investigation.id}`} className="link-underline">
                  {tip.investigation.caseNumber} — {tip.investigation.title}
                </Link>
              </p>
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Traitement" />
          <CardBody>
            <TipControls
              tipId={tip.id}
              status={tip.status}
              assignedToId={tip.assignedToId}
              investigationId={tip.investigationId}
              canAssign={canAssign}
              agents={agents.map((a) => ({ id: a.id, label: `${a.user.name} · ${a.badgeNumber}` }))}
              investigations={investigations.map((i) => ({
                id: i.id,
                label: `${i.caseNumber} — ${i.title}`,
              }))}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Notes internes" />
          <CardBody>
            <TipNotes
              tipId={tip.id}
              notes={tip.notes.map((n) => ({
                id: n.id,
                body: n.body,
                author: n.author?.user.name ?? null,
                createdAt: n.createdAt.toISOString(),
              }))}
            />
          </CardBody>
        </Card>

        <p className="text-xs text-navy-400">Dernière mise à jour {formatDateTime(tip.updatedAt)}.</p>
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
