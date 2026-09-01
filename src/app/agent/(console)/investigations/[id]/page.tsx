import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAgent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getInvestigationOr404, canEditInvestigation } from "@/lib/access";
import { RbacError, can, RANK_ABBR, type Rank } from "@/lib/rbac";
import { Breadcrumbs } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { PageTitle } from "@/components/agent/ui";
import {
  CaseStatusControl,
  AddNote,
  AddEvidence,
  AddTimelineEntry,
} from "@/components/agent/case-actions";
import { CreateMostWanted } from "@/components/agent/create-most-wanted";
import {
  InvestigationPersons,
  InvestigationWarrants,
  InvestigationArrests,
  InvestigationDelete,
  InvestigationEvidence,
} from "@/components/agent/case-relations";
import { formatDate, formatDateTime } from "@/lib/format";
import {
  INVESTIGATION_STATUS,
  PRIORITY,
  CLASSIFICATION,
  PERSON_ROLE,
  MOST_WANTED_STATUS,
} from "@/lib/constants";

export default async function InvestigationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const actor = await requireAgent();
  let inv;
  try {
    inv = await getInvestigationOr404(params.id, actor);
  } catch (e) {
    if (e instanceof RbacError) notFound();
    throw e;
  }

  const assignedAgentIds = inv.assignedAgents.map((a) => a.agentId);
  const editable = canEditInvestigation(actor, {
    leadAgentId: inv.leadAgentId,
    assignedAgentIds,
  });
  const persons = inv.persons.map((p) => ({
    id: p.person.id,
    label: `${p.person.fullName} (${PERSON_ROLE[p.role]})`,
  }));

  const perms = {
    edit: editable,
    close: can(actor, "investigation.close"),
    publish: can(actor, "investigation.publish"),
    createMostWanted: can(actor, "mostwanted.create"),
    addNote: can(actor, "note.create"),
    addEvidence: editable && can(actor, "evidence.create"),
    addTimeline: can(actor, "timeline.create"),
    linkPerson: editable && can(actor, "person.link"),
    createPerson: can(actor, "suspect.create"),
    warrantCreate: editable && can(actor, "warrant.request"),
    warrantEdit: editable && can(actor, "warrant.edit"),
    warrantApprove: can(actor, "warrant.approve"),
    warrantDelete: can(actor, "warrant.delete"),
    arrestCreate: editable && can(actor, "arrest.create"),
    arrestEdit: editable && can(actor, "arrest.edit"),
    arrestDelete: can(actor, "arrest.delete"),
    editEvidence: editable && can(actor, "evidence.create"),
    deleteEvidence: can(actor, "evidence.delete"),
    downloadEvidence: can(actor, "evidence.download"),
    deleteInvestigation: can(actor, "investigation.delete"),
  };

  const canManageRelations =
    perms.linkPerson || perms.warrantCreate || perms.warrantEdit || perms.arrestCreate;
  const [allPersons, activeAgents] = canManageRelations
    ? await Promise.all([
        prisma.person.findMany({
          where: { deletedAt: null },
          orderBy: { fullName: "asc" },
          take: 1000,
          select: { id: true, fullName: true, alias: true },
        }),
        prisma.agent.findMany({
          where: { status: "ACTIVE" },
          include: { user: true },
          orderBy: { rank: "desc" },
        }),
      ])
    : [[], []];

  const linkedPersons = inv.persons.map((p) => ({
    linkId: p.id,
    personId: p.person.id,
    name: p.person.fullName,
    alias: p.person.alias,
    role: p.role,
  }));
  const personPickList = persons; // {id,label} — persons already on the case
  const allPersonPickList = allPersons.map((p) => ({
    id: p.id,
    label: p.alias ? `${p.fullName} « ${p.alias} »` : p.fullName,
  }));
  const agentPickList = activeAgents.map((a) => ({
    id: a.id,
    label: `${a.user.name} · ${RANK_ABBR[a.rank as Rank]} · ${a.badgeNumber}`,
  }));
  const warrantList = inv.warrants.map((w) => ({
    id: w.id,
    warrantNumber: w.warrantNumber,
    type: w.type,
    status: w.status,
    personId: w.personId,
    personName: w.person?.fullName ?? null,
    issuingJudge: w.issuingJudge,
    description: w.description,
    issuedDate: w.issuedDate ? w.issuedDate.toISOString().slice(0, 10) : null,
    expiryDate: w.expiryDate ? w.expiryDate.toISOString().slice(0, 10) : null,
  }));
  const arrestList = inv.arrests.map((a) => ({
    id: a.id,
    personId: a.personId,
    personName: a.person.fullName,
    date: a.arrestDate.toISOString().slice(0, 10),
    location: a.location,
    charges: a.charges,
    notes: a.notes,
    agentId: a.arrestingAgentId,
    agentName: a.arrestingAgent?.user.name ?? null,
  }));
  const evidenceList = inv.evidence.map((e) => ({
    id: e.id,
    evidenceNumber: e.evidenceNumber,
    type: e.type,
    title: e.title,
    description: e.description,
    chainOfCustody: e.chainOfCustody,
    personId: e.personId,
    collectedAt: e.collectedAt.toISOString(),
    collectedByName: e.collectedBy?.user.name ?? null,
    fileUrl: e.file?.url ?? null,
  }));

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Enquêtes", href: "/agent/investigations" },
          { label: inv.caseNumber },
        ]}
      />
      <PageTitle
        title={inv.title}
        subtitle={`${inv.caseNumber} · Ouverte le ${formatDate(inv.openedAt)}`}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Badge tone={INVESTIGATION_STATUS[inv.status]?.tone}>
          {INVESTIGATION_STATUS[inv.status]?.label}
        </Badge>
        <Badge tone={PRIORITY[inv.priority]?.tone}>Priorité {PRIORITY[inv.priority]?.label}</Badge>
        <Badge tone={CLASSIFICATION[inv.classification]?.tone}>
          {CLASSIFICATION[inv.classification]?.label}
        </Badge>
        {inv.isPublic ? <Badge tone="green">Public</Badge> : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div>
          <Tabs
            tabs={[
              {
                id: "overview",
                label: "Présentation",
                content: (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader title="Description" />
                      <CardBody>
                        <p className="prose-fia whitespace-pre-line">{inv.description}</p>
                      </CardBody>
                    </Card>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <Card>
                        <CardHeader title="Chefs d'accusation" />
                        <CardBody>
                          {inv.charges.length ? (
                            <ul className="list-disc space-y-1 pl-5 text-sm">
                              {inv.charges.map((c) => (
                                <li key={c.id}>
                                  {c.charge.title}
                                  {c.person ? ` — ${c.person.fullName}` : ""}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-navy-500">Aucun chef d'accusation enregistré.</p>
                          )}
                        </CardBody>
                      </Card>
                      <Card>
                        <CardHeader title="Agents affectés" />
                        <CardBody>
                          <ul className="space-y-1 text-sm">
                            {inv.leadAgent ? (
                              <li>
                                <span className="font-medium">{inv.leadAgent.user.name}</span>{" "}
                                <span className="text-navy-400">— Agent responsable</span>
                              </li>
                            ) : null}
                            {inv.assignedAgents.map((a) => (
                              <li key={a.id}>
                                {a.agent.user.name}{" "}
                                <span className="text-navy-400">— {a.role}</span>
                              </li>
                            ))}
                          </ul>
                        </CardBody>
                      </Card>
                    </div>
                    {(inv.vehicles.length > 0 || inv.organizations.length > 0 || inv.locations.length > 0) && (
                      <Card>
                        <CardHeader title="Entités liées" />
                        <CardBody className="space-y-3 text-sm">
                          {inv.vehicles.length > 0 && (
                            <div>
                              <p className="font-semibold text-navy-700">Véhicules</p>
                              {inv.vehicles.map((v) => (
                                <p key={v.vehicleId} className="text-navy-600">
                                  {[v.vehicle.color, v.vehicle.make, v.vehicle.model, v.vehicle.plate]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </p>
                              ))}
                            </div>
                          )}
                          {inv.organizations.length > 0 && (
                            <div>
                              <p className="font-semibold text-navy-700">Organisations</p>
                              {inv.organizations.map((o) => (
                                <p key={o.organizationId} className="text-navy-600">
                                  {o.organization.name}
                                </p>
                              ))}
                            </div>
                          )}
                          {inv.locations.length > 0 && (
                            <div>
                              <p className="font-semibold text-navy-700">Lieux</p>
                              {inv.locations.map((l) => (
                                <p key={l.id} className="text-navy-600">
                                  {l.label} {l.address ? `— ${l.address}` : ""}
                                </p>
                              ))}
                            </div>
                          )}
                        </CardBody>
                      </Card>
                    )}
                  </div>
                ),
              },
              {
                id: "persons",
                label: "Personnes",
                count: inv.persons.length,
                content: (
                  <InvestigationPersons
                    investigationId={inv.id}
                    linked={linkedPersons}
                    allPersons={allPersonPickList}
                    caps={{ link: perms.linkPerson, createNew: perms.createPerson }}
                  />
                ),
              },
              {
                id: "evidence",
                label: "Preuves",
                count: inv.evidence.length,
                content: (
                  <div className="space-y-4">
                    <InvestigationEvidence
                      items={evidenceList}
                      casePersons={personPickList}
                      canDownload={perms.downloadEvidence}
                      caps={{ edit: perms.editEvidence, del: perms.deleteEvidence }}
                    />
                    {perms.addEvidence ? (
                      <Card>
                        <CardHeader title="Enregistrer une nouvelle preuve" />
                        <CardBody>
                          <AddEvidence investigationId={inv.id} persons={persons} />
                        </CardBody>
                      </Card>
                    ) : null}
                  </div>
                ),
              },
              {
                id: "timeline",
                label: "Chronologie",
                count: inv.timeline.length,
                content: (
                  <div className="space-y-4">
                    {perms.addTimeline ? <AddTimelineEntry investigationId={inv.id} /> : null}
                    <ol className="space-y-4 border-l-2 border-navy-200 pl-5">
                      {inv.timeline.map((t) => (
                        <li key={t.id} className="relative">
                          <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-navy-400" />
                          <p className="text-xs font-semibold text-navy-500">
                            {formatDateTime(t.occurredAt)}
                          </p>
                          <p className="text-sm text-navy-800">{t.message}</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                ),
              },
              {
                id: "notes",
                label: "Notes",
                count: inv.notes.length,
                content: (
                  <div className="space-y-4">
                    {perms.addNote ? <AddNote investigationId={inv.id} /> : null}
                    {inv.notes.map((n) => (
                      <div key={n.id} className="rounded-lg border border-navy-200 bg-white p-4">
                        <p className="whitespace-pre-line text-sm text-navy-800">{n.body}</p>
                        <p className="mt-2 text-xs text-navy-400">
                          {n.author?.user.name ?? "Inconnu"} · {formatDateTime(n.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                id: "warrants",
                label: "Mandats et arrestations",
                count: inv.warrants.length + inv.arrests.length,
                content: (
                  <div className="space-y-6 text-sm">
                    <Card>
                      <CardHeader title="Mandats" />
                      <CardBody>
                        <InvestigationWarrants
                          investigationId={inv.id}
                          warrants={warrantList}
                          casePersons={personPickList}
                          caps={{
                            create: perms.warrantCreate,
                            edit: perms.warrantEdit,
                            approve: perms.warrantApprove,
                            del: perms.warrantDelete,
                          }}
                        />
                      </CardBody>
                    </Card>
                    <Card>
                      <CardHeader title="Arrestations" />
                      <CardBody>
                        <InvestigationArrests
                          investigationId={inv.id}
                          arrests={arrestList}
                          casePersons={personPickList}
                          agents={agentPickList}
                          caps={{
                            create: perms.arrestCreate,
                            edit: perms.arrestEdit,
                            del: perms.arrestDelete,
                          }}
                        />
                      </CardBody>
                    </Card>
                  </div>
                ),
              },
            ]}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Gestion du dossier" />
            <CardBody className="space-y-4">
              {perms.edit || perms.close || perms.publish ? (
                <CaseStatusControl
                  investigationId={inv.id}
                  currentStatus={inv.status}
                  isPublic={inv.isPublic}
                  perms={perms}
                  persons={persons}
                />
              ) : (
                <p className="text-sm text-navy-500">Vous avez un accès en lecture seule à ce dossier.</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Informations sur le dossier" />
            <CardBody className="space-y-2 text-sm">
              <Info label="Case Number" value={inv.caseNumber} mono />
              <Info label="Field Office" value={inv.fieldOffice?.name} />
              <Info label="Division" value={inv.division} />
              <Info label="Unité" value={inv.unit} />
              <Info label="Groupe d'intervention" value={inv.taskForce} />
              <Info label="Juridiction" value={inv.jurisdiction} />
              <Info label="Date de l'incident" value={inv.incidentDate ? formatDate(inv.incidentDate) : null} />
              <Info label="Lieu de l'incident" value={inv.incidentLocation} />
              <Info label="Agent responsable" value={inv.leadAgent?.user.name} />
              <Info label="Dernière mise à jour" value={formatDateTime(inv.updatedAt)} />
              {inv.closedAt ? <Info label="Clôturée le" value={formatDate(inv.closedAt)} /> : null}
            </CardBody>
          </Card>

          {perms.createMostWanted ? (
            <Card>
              <CardHeader title="Most Wanted" />
              <CardBody className="space-y-3">
                {inv.mostWanted.length > 0 ? (
                  <ul className="space-y-1 text-sm">
                    {inv.mostWanted.map((mw) => (
                      <li key={mw.id}>
                        <Link href={`/agent/most-wanted/${mw.id}`} className="link-underline">
                          {mw.publicId} · {mw.fullName} ({MOST_WANTED_STATUS[mw.status]?.label ?? mw.status})
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <CreateMostWanted
                  investigationId={inv.id}
                  persons={persons}
                  defaults={{
                    charges: inv.charges.map((c) => c.charge.title),
                    leadAgent: inv.leadAgent?.user.name ?? null,
                    caseNumber: inv.caseNumber,
                  }}
                />
              </CardBody>
            </Card>
          ) : null}

          {(inv.relatedFrom.length > 0 || inv.relatedTo.length > 0) && (
            <Card>
              <CardHeader title="Dossiers liés" />
              <CardBody className="space-y-1 text-sm">
                {[...inv.relatedFrom.map((r) => r.to), ...inv.relatedTo.map((r) => r.from)].map((r) => (
                  <Link key={r.id} href={`/agent/investigations/${r.id}`} className="link-underline block">
                    {r.caseNumber} — {r.title}
                  </Link>
                ))}
              </CardBody>
            </Card>
          )}

          {perms.deleteInvestigation ? (
            <Card>
              <CardHeader title="Zone de danger" />
              <CardBody>
                <InvestigationDelete investigationId={inv.id} caseNumber={inv.caseNumber} />
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-xs uppercase tracking-wide text-navy-400">{label}</span>
      <span className={mono ? "font-mono text-navy-900" : "text-right text-navy-800"}>
        {value || "—"}
      </span>
    </div>
  );
}
