import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { can } from "@/lib/rbac";
import { PageTitle } from "@/components/agent/ui";
import { Breadcrumbs } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { SuspectForm } from "@/components/agent/suspect-form";
import { SuspectDelete } from "@/components/agent/suspect-delete";
import { RISK_LEVEL, PERSON_ROLE } from "@/lib/constants";
import { ageFromDob, formatDate } from "@/lib/format";

export default async function SuspectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const actor = await requirePermission("suspect.view");
  const p = await prisma.person.findFirst({
    where: { id: params.id, deletedAt: null },
    include: {
      investigations: { include: { investigation: true } },
      evidence: true,
      warrants: true,
      arrests: true,
      mostWanted: true,
      vehicles: { include: { vehicle: true } },
      organizations: { include: { organization: true } },
      createdBy: { include: { user: true } },
      _count: { select: { investigations: true, arrests: true, mostWanted: true } },
    },
  });
  if (!p) notFound();

  const editable = can(actor, "suspect.edit");
  const deletable = can(actor, "suspect.delete");

  return (
    <div>
      <Breadcrumbs items={[{ label: "Suspects", href: "/agent/suspects" }, { label: p.fullName }]} />
      <PageTitle
        title={p.fullName}
        subtitle={p.alias ? `Alias « ${p.alias} »` : undefined}
        action={
          <div className="flex items-center gap-3">
            <a
              href={`/agent/print/suspect/${p.id}`}
              target="_blank"
              className="rounded-md border border-navy-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-navy-700 hover:bg-navy-50"
            >
              Fiche PDF
            </a>
            <Badge tone={RISK_LEVEL[p.riskLevel]?.tone}>
              Risque {RISK_LEVEL[p.riskLevel]?.label}
            </Badge>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div>
          <Tabs
            tabs={[
              {
                id: "profile",
                label: "Profil",
                content: (
                  <div className="space-y-4 text-sm">
                    {p.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photoUrl} alt="" className="h-48 w-40 rounded-lg border border-navy-200 object-cover" />
                    ) : null}
                    <Card>
                      <CardHeader title="Description" />
                      <CardBody>
                        <p className="whitespace-pre-line text-navy-700">{p.description || "—"}</p>
                      </CardBody>
                    </Card>
                    <Card>
                      <CardHeader title="Antécédents judiciaires" />
                      <CardBody>
                        <p className="whitespace-pre-line text-navy-700">{p.criminalHistory || "—"}</p>
                      </CardBody>
                    </Card>
                    <Card>
                      <CardHeader title="Notes" />
                      <CardBody>
                        <p className="whitespace-pre-line text-navy-700">{p.notes || "—"}</p>
                      </CardBody>
                    </Card>
                  </div>
                ),
              },
              {
                id: "cases",
                label: "Dossiers associés",
                count: p.investigations.length,
                content: (
                  <div className="space-y-2">
                    {p.investigations.length === 0 ? (
                      <p className="text-sm text-navy-500">Lié à aucune enquête.</p>
                    ) : (
                      p.investigations.map((ip) => (
                        <Link
                          key={ip.id}
                          href={`/agent/investigations/${ip.investigation.id}`}
                          className="flex items-center justify-between rounded-lg border border-navy-200 bg-white px-4 py-3 hover:bg-navy-50"
                        >
                          <span>
                            <span className="font-mono text-xs text-navy-400">
                              {ip.investigation.caseNumber}
                            </span>
                            <span className="block text-sm font-medium">{ip.investigation.title}</span>
                          </span>
                          <Badge>{PERSON_ROLE[ip.role]}</Badge>
                        </Link>
                      ))
                    )}
                  </div>
                ),
              },
              {
                id: "links",
                label: "Véhicules et organisations",
                content: (
                  <div className="space-y-4 text-sm">
                    <Card>
                      <CardHeader title="Véhicules" />
                      <CardBody>
                        {p.vehicles.length === 0 ? (
                          <p className="text-navy-500">Aucun.</p>
                        ) : (
                          p.vehicles.map((v) => (
                            <p key={v.vehicleId}>
                              {[v.vehicle.color, v.vehicle.make, v.vehicle.model, v.vehicle.plate].filter(Boolean).join(" · ")}
                            </p>
                          ))
                        )}
                      </CardBody>
                    </Card>
                    <Card>
                      <CardHeader title="Organisations" />
                      <CardBody>
                        {p.organizations.length === 0 ? (
                          <p className="text-navy-500">Aucune.</p>
                        ) : (
                          p.organizations.map((o) => <p key={o.organizationId}>{o.organization.name}</p>)
                        )}
                      </CardBody>
                    </Card>
                  </div>
                ),
              },
              ...(editable
                ? [
                    {
                      id: "edit",
                      label: "Modifier",
                      content: (
                        <SuspectForm
                          mode={"edit" as const}
                          id={p.id}
                          initial={{
                            fullName: p.fullName,
                            alias: p.alias,
                            dob: p.dob ? p.dob.toISOString().slice(0, 10) : "",
                            gender: p.gender,
                            photoUrl: p.photoUrl,
                            description: p.description,
                            knownAddresses: p.knownAddresses,
                            riskLevel: p.riskLevel,
                            criminalHistory: p.criminalHistory,
                            notes: p.notes,
                          }}
                        />
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Identité" />
            <CardBody className="space-y-2 text-sm">
              <Row label="Âge" value={ageFromDob(p.dob)?.toString()} />
              <Row label="Date de naissance" value={p.dob ? formatDate(p.dob) : null} />
              <Row label="Genre" value={p.gender} />
              <Row label="Adresses connues" value={p.knownAddresses} />
              <Row label="Fiche créée le" value={formatDate(p.createdAt)} />
              <Row label="Créée par" value={p.createdBy?.user.name} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Application de la loi" />
            <CardBody className="space-y-2 text-sm">
              <Row label="Mandats" value={p.warrants.length.toString()} />
              <Row label="Arrestations" value={p.arrests.length.toString()} />
              <Row label="Éléments de preuve" value={p.evidence.length.toString()} />
              <Row label="Most Wanted" value={p.mostWanted.length.toString()} />
            </CardBody>
          </Card>

          {deletable ? (
            <Card>
              <CardHeader title="Zone de danger" />
              <CardBody>
                <SuspectDelete
                  suspectId={p.id}
                  name={p.fullName}
                  linkedCounts={{
                    investigations: p._count.investigations,
                    arrests: p._count.arrests,
                    mostWanted: p._count.mostWanted,
                  }}
                />
              </CardBody>
            </Card>
          ) : null}
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
