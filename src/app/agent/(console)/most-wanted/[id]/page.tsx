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
import { MostWantedWorkflow, MostWantedEditor } from "@/components/agent/most-wanted-admin";
import { MOST_WANTED_STATUS, DANGER_LEVEL, MOST_WANTED_CATEGORY } from "@/lib/constants";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";

export default async function AgentMostWantedDetail({
  params,
}: {
  params: { id: string };
}) {
  const actor = await requirePermission("mostwanted.view");
  const mw = await prisma.mostWanted.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { include: { user: true } },
      reviewedBy: { include: { user: true } },
      investigation: true,
      person: true,
      tips: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!mw) notFound();

  const caps = {
    review: can(actor, "mostwanted.review"),
    publish: can(actor, "mostwanted.publish"),
    edit: can(actor, "mostwanted.edit") || (mw.createdById === actor.agent?.id && mw.status === "DRAFT"),
    archive: can(actor, "mostwanted.archive"),
    del: can(actor, "mostwanted.delete"),
  };

  return (
    <div>
      <Breadcrumbs
        items={[{ label: "Most Wanted", href: "/agent/most-wanted" }, { label: mw.publicId }]}
      />
      <PageTitle
        title={mw.fullName}
        subtitle={`${mw.publicId} · ${MOST_WANTED_CATEGORY[mw.category]}`}
        action={
          <div className="flex gap-2">
            <Badge tone={MOST_WANTED_STATUS[mw.status]?.tone}>{MOST_WANTED_STATUS[mw.status]?.label}</Badge>
            <Badge tone={DANGER_LEVEL[mw.dangerLevel]?.tone}>{DANGER_LEVEL[mw.dangerLevel]?.label}</Badge>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div>
          <Card className="mb-6">
            <CardHeader title="Flux de validation" description="DRAFT → REVIEW → PUBLISHED → CAPTURED / LOCATED → ARCHIVED" />
            <CardBody>
              <MostWantedWorkflow id={mw.id} status={mw.status} caps={caps} />
            </CardBody>
          </Card>

          <Tabs
            tabs={[
              {
                id: "public",
                label: "Bulletin public",
                content: (
                  <div className="space-y-3 text-sm">
                    {mw.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={mw.photoUrl} alt="" className="h-56 w-44 rounded-lg border border-navy-200 object-cover" />
                    ) : null}
                    <p className="prose-fia whitespace-pre-line">{mw.description}</p>
                    <div>
                      <p className="font-semibold text-navy-700">Chefs d&apos;accusation</p>
                      <ul className="list-disc pl-5">
                        {mw.charges.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                    {mw.status === "PUBLISHED" ? (
                      <Link href={`/most-wanted/${mw.id}`} target="_blank" className="link-underline">
                        Voir la page publique en ligne ↗
                      </Link>
                    ) : null}
                  </div>
                ),
              },
              ...(caps.edit
                ? [
                    {
                      id: "edit",
                      label: "Modifier",
                      content: (
                        <MostWantedEditor
                          id={mw.id}
                          initial={{
                            fullName: mw.fullName,
                            aliases: mw.aliases,
                            age: mw.age,
                            reward: mw.reward,
                            photoUrl: mw.photoUrl,
                            category: mw.category,
                            dangerLevel: mw.dangerLevel,
                            lastKnownLocation: mw.lastKnownLocation,
                            vehicle: mw.vehicle,
                            associates: mw.associates,
                            knownOrganizations: mw.knownOrganizations,
                            dateLastSeen: mw.dateLastSeen ? mw.dateLastSeen.toISOString().slice(0, 10) : "",
                            charges: mw.charges.join("\n"),
                            description: mw.description,
                          }}
                        />
                      ),
                    },
                  ]
                : []),
              {
                id: "tips",
                label: "Renseignements",
                count: mw.tips.length,
                content: (
                  <div className="space-y-2 text-sm">
                    {mw.tips.length === 0 ? (
                      <p className="text-navy-500">Aucun renseignement reçu pour ce bulletin.</p>
                    ) : (
                      mw.tips.map((t) => (
                        <div key={t.id} className="rounded-lg border border-navy-200 bg-white p-3">
                          <p className="font-medium">{t.subject}</p>
                          <p className="text-navy-600">{t.description}</p>
                          <p className="mt-1 text-xs text-navy-400">
                            {t.publicId} · {formatDateTime(t.createdAt)} ·{" "}
                            {t.anonymous ? "Anonyme" : t.name ?? "—"}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                ),
              },
            ]}
          />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Informations du bulletin" />
            <CardBody className="space-y-2 text-sm">
              <Row label="Récompense" value={mw.reward ? formatMoney(mw.reward) : "—"} />
              <Row label="Case Number" value={mw.caseNumber} />
              <Row label="Agent responsable" value={mw.leadAgent} />
              <Row label="Créé par" value={mw.createdBy?.user.name} />
              <Row label="Révisé par" value={mw.reviewedBy?.user.name} />
              <Row label="Publié le" value={mw.publishedAt ? formatDate(mw.publishedAt) : null} />
              {mw.investigation ? (
                <div className="pt-1">
                  <Link href={`/agent/investigations/${mw.investigation.id}`} className="link-underline text-xs">
                    Dossier lié : {mw.investigation.caseNumber}
                  </Link>
                </div>
              ) : null}
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
