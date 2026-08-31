import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/public/page-header";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { INVESTIGATION_STATUS, PRIORITY } from "@/lib/constants";

async function load(id: string) {
  return prisma.investigation.findFirst({
    where: { id, isPublic: true },
    include: {
      leadAgent: { include: { user: true } },
      fieldOffice: true,
      charges: { include: { charge: true } },
      timeline: { orderBy: { occurredAt: "desc" }, take: 20 },
      news: { where: { status: "PUBLISHED" }, orderBy: { publishedAt: "desc" } },
      mostWanted: { where: { status: "PUBLISHED" } },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const c = await load(params.id);
  if (!c) return { title: "Dossier introuvable" };
  return { title: `${c.caseNumber} — ${c.title}` };
}

export default async function PublicInvestigationDetail({
  params,
}: {
  params: { id: string };
}) {
  const c = await load(params.id);
  if (!c) notFound();

  return (
    <div>
      <PageHeader
        title={c.title}
        crumbs={[
          { label: "Accueil", href: "/" },
          { label: "Enquêtes", href: "/investigations" },
          { label: c.caseNumber },
        ]}
      />
      <div className="container-fia grid gap-10 py-12 lg:grid-cols-[1fr_300px]">
        <div className="space-y-8">
          <div className="flex flex-wrap gap-2">
            <Badge tone={INVESTIGATION_STATUS[c.status]?.tone}>
              {INVESTIGATION_STATUS[c.status]?.label}
            </Badge>
            <Badge tone={PRIORITY[c.priority]?.tone}>
              Priorité {PRIORITY[c.priority]?.label}
            </Badge>
          </div>

          <section>
            <h2 className="border-b-2 border-navy-900 pb-1 text-lg font-bold uppercase">
              Présentation
            </h2>
            <p className="prose-fia mt-4 whitespace-pre-line">{c.description}</p>
          </section>

          {c.charges.length > 0 ? (
            <section>
              <h2 className="border-b-2 border-navy-900 pb-1 text-lg font-bold uppercase">
                Chefs d'accusation
              </h2>
              <ul className="mt-4 list-disc space-y-1 pl-5">
                {c.charges.map((ic) => (
                  <li key={ic.id}>{ic.charge.title}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {c.timeline.length > 0 ? (
            <section>
              <h2 className="border-b-2 border-navy-900 pb-1 text-lg font-bold uppercase">
                Chronologie du dossier
              </h2>
              <ol className="mt-4 space-y-4 border-l-2 border-navy-200 pl-5">
                {c.timeline.map((t) => (
                  <li key={t.id} className="relative">
                    <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-navy-400" />
                    <p className="text-xs font-semibold text-navy-500">
                      {formatDate(t.occurredAt)}
                    </p>
                    <p className="text-sm text-navy-800">{t.message}</p>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4 text-sm">
          <div className="rounded-lg border border-navy-200 bg-navy-50 p-4">
            <h3 className="font-semibold text-navy-800">Informations sur le dossier</h3>
            <dl className="mt-2 space-y-1 text-navy-600">
              <div>
                <dt className="text-xs uppercase text-navy-400">Case Number</dt>
                <dd className="font-mono">{c.caseNumber}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-navy-400">Agence responsable</dt>
                <dd>Federal Bureau of Investigation</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-navy-400">Field Office</dt>
                <dd>{c.fieldOffice?.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-navy-400">Ouvert le</dt>
                <dd>{formatDate(c.openedAt)}</dd>
              </div>
            </dl>
          </div>

          {c.mostWanted.length > 0 ? (
            <div className="rounded-lg border border-navy-200 bg-navy-50 p-4">
              <h3 className="font-semibold text-navy-800">Recherché dans ce dossier</h3>
              <ul className="mt-2 space-y-1">
                {c.mostWanted.map((mw) => (
                  <li key={mw.id}>
                    <Link href={`/most-wanted/${mw.id}`} className="link-underline">
                      {mw.fullName}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="rounded-lg border border-navy-200 bg-navy-50 p-4">
            <h3 className="font-semibold text-navy-800">Vous avez des informations ?</h3>
            <Link href="/submit-tip" className="link-underline mt-1 block">
              Soumettre un renseignement
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
