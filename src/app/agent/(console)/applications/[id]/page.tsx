import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { can } from "@/lib/rbac";
import { PageTitle } from "@/components/agent/ui";
import { Breadcrumbs } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { ApplicationWorkflow } from "@/components/agent/application-workflow";
import { APPLICATION_STATUS, APPLICATION_POSITION } from "@/lib/constants";
import { formatDate, formatDateTime, ageFromDob } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const actor = await requirePermission("applications.view");

  const app = await prisma.application.findUnique({
    where: { id: params.id },
    include: {
      assignedRecruiter: { include: { user: true } },
      decidedBy: { include: { user: true } },
      hiredAgent: { select: { id: true, badgeNumber: true } },
    },
  });
  if (!app) notFound();

  const canReview = can(actor, "applications.review");
  const canDecide = can(actor, "applications.approve") || can(actor, "applications.reject");
  const canRecruit = can(actor, "agents.manage");

  const recruiters = canReview
    ? await prisma.agent.findMany({
        where: { status: "ACTIVE" },
        include: { user: true },
        orderBy: { user: { name: "asc" } },
      })
    : [];

  const files: [string, string | null][] = [
    ["CV / résumé", app.resumeUrl],
    ["Pièce d'identité", app.idUrl],
    ["Certifications", app.certUrl],
    ["Document complémentaire", app.additionalUrl],
  ];

  return (
    <div className="max-w-4xl">
      <Breadcrumbs
        items={[{ label: "Candidatures", href: "/agent/applications" }, { label: app.publicId }]}
      />
      <PageTitle
        title={`${app.firstName} ${app.lastName}`}
        subtitle={`${app.publicId} · ${APPLICATION_POSITION[app.position] ?? app.position} · reçue le ${formatDate(app.createdAt)}`}
        action={
          <div className="flex items-center gap-3">
            {canRecruit && app.status === "APPROVED" && !app.hiredAgent ? (
              <Link
                href={`/agent/agents/new?application=${app.id}`}
                className="rounded-md bg-navy-800 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-navy-900"
              >
                Recruter
              </Link>
            ) : null}
            <Badge tone={APPLICATION_STATUS[app.status]?.tone}>
              {APPLICATION_STATUS[app.status]?.label ?? app.status}
            </Badge>
          </div>
        }
      />

      {app.hiredAgent ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          Candidat recruté —{" "}
          <Link href={`/agent/agents/${app.hiredAgent.id}`} className="link-underline">
            matricule {app.hiredAgent.badgeNumber}
          </Link>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Identité et contact" />
            <CardBody className="grid gap-2 text-sm sm:grid-cols-2">
              <Row label="Nom complet" value={`${app.firstName} ${app.lastName}`} />
              <Row label="E-mail" value={app.email} />
              <Row label="Téléphone" value={app.phone} />
              <Row
                label="Date de naissance"
                value={
                  app.dob
                    ? `${formatDate(app.dob)} (${ageFromDob(app.dob)} ans)`
                    : "—"
                }
              />
              <Row
                label="Adresse"
                value={[app.address, app.city, app.state, app.zip].filter(Boolean).join(", ")}
              />
              <Row label="Poste visé" value={APPLICATION_POSITION[app.position] ?? app.position} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Parcours" />
            <CardBody className="space-y-3 text-sm">
              <Block label="Emploi actuel" value={app.currentOccupation} />
              <Block label="Expérience forces de l'ordre" value={app.priorLeExperience} />
              <Block label="Expérience militaire" value={app.militaryExperience} />
              <Block label="Formation" value={app.education} />
              <Block label="Certifications" value={app.certifications} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Motivation" />
            <CardBody className="space-y-3 text-sm">
              <Block label="Pourquoi rejoindre le FBI" value={app.whyJoin} />
              <Block label="Pourquoi être un bon candidat" value={app.whyGoodCandidate} />
              <Block label="Décision difficile" value={app.difficultDecision} />
              <Block label="Gestion de la pression" value={app.pressureExperience} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Pièces jointes" />
            <CardBody className="space-y-2 text-sm">
              {files.filter(([, url]) => url).length === 0 ? (
                <p className="text-navy-500">Aucune pièce jointe.</p>
              ) : (
                files
                  .filter(([, url]) => url)
                  .map(([label, url]) => (
                    <a
                      key={label}
                      href={url!}
                      target="_blank"
                      className="block font-semibold text-navy-700 underline"
                    >
                      {label}
                    </a>
                  ))
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Instruction" />
            <CardBody>
              <ApplicationWorkflow
                applicationId={app.id}
                canReview={canReview}
                canDecide={canDecide}
                recruiters={recruiters.map((r) => ({
                  id: r.id,
                  label: `${r.user.name} · ${r.badgeNumber}`,
                }))}
                initial={{
                  status: app.status,
                  assignedRecruiterId: app.assignedRecruiterId,
                  notes: app.notes,
                  interviewNotes: app.interviewNotes,
                  backgroundCheckNotes: app.backgroundCheckNotes,
                  decision: app.decision,
                }}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Suivi" />
            <CardBody className="space-y-2 text-sm">
              <Row label="Recruteur" value={app.assignedRecruiter?.user.name} />
              <Row label="Décision par" value={app.decidedBy?.user.name} />
              <Row label="Certifiée exacte" value={app.certified ? "Oui" : "Non"} />
              <Row label="Dernière mise à jour" value={formatDateTime(app.updatedAt)} />
            </CardBody>
          </Card>
        </div>
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

function Block({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">{label}</p>
      <p className="mt-0.5 whitespace-pre-line text-navy-800">{value || "—"}</p>
    </div>
  );
}
