import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/misc";
import { TipForm } from "@/components/public/tip-form";
import { formatDate } from "@/lib/format";
import { WARRANT_STATUS, WARRANT_TYPE } from "@/lib/constants";

async function load(number: string) {
  return prisma.warrant.findFirst({
    where: {
      warrantNumber: decodeURIComponent(number),
      isPublic: true,
      investigation: { deletedAt: null },
    },
    include: {
      person: true,
      investigation: { select: { caseNumber: true, isPublic: true, id: true } },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: { number: string };
}): Promise<Metadata> {
  const w = await load(params.number);
  if (!w) return { title: "Mandat introuvable" };
  return {
    title: `Mandat ${w.warrantNumber} — ${WARRANT_TYPE[w.type] ?? w.type}`,
    description: w.publicSummary?.slice(0, 155) ?? "Avis public du Federal Bureau of Investigation.",
  };
}

export default async function PublicWarrantPage({
  params,
}: {
  params: { number: string };
}) {
  const w = await load(params.number);
  if (!w) notFound();

  return (
    <div>
      <div className="border-b border-navy-200 bg-navy-900 text-white">
        <div className="container-fia py-10">
          <Breadcrumbs
            items={[
              { label: "Accueil", href: "/" },
              { label: "Mandats", href: "/warrants" },
              { label: w.warrantNumber },
            ]}
          />
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.25em] text-federal-accent">
            Avis de mandat
          </p>
          <h1 className="mt-2 text-4xl font-bold">
            Mandat de {WARRANT_TYPE[w.type]?.toLowerCase() ?? w.type}
          </h1>
          <p className="mt-2 font-mono text-navy-300">{w.warrantNumber}</p>
        </div>
      </div>

      <div className="container-fia grid gap-10 py-12 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Badge tone={WARRANT_STATUS[w.status]?.tone}>
              {WARRANT_STATUS[w.status]?.label ?? w.status}
            </Badge>
            <Badge>{WARRANT_TYPE[w.type] ?? w.type}</Badge>
          </div>

          {w.person ? (
            <div className="flex items-center gap-4">
              {w.person.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={w.person.photoUrl}
                  alt=""
                  className="h-28 w-24 rounded-lg border border-navy-200 object-cover"
                />
              ) : null}
              <div>
                <p className="text-lg font-bold text-navy-900">{w.person.fullName}</p>
                {w.person.alias ? (
                  <p className="text-sm text-navy-500">Alias « {w.person.alias} »</p>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="prose-fia whitespace-pre-line text-navy-700">
            {w.publicSummary || "Le Federal Bureau of Investigation a émis ce mandat dans le cadre d'une enquête fédérale en cours."}
          </div>

          <dl className="grid gap-3 rounded-lg border border-navy-200 bg-white p-5 text-sm sm:grid-cols-2">
            <Row label="Numéro de mandat" value={w.warrantNumber} />
            <Row label="Type" value={WARRANT_TYPE[w.type] ?? w.type} />
            <Row label="Juge émetteur" value={w.issuingJudge} />
            <Row label="Émis le" value={w.issuedDate ? formatDate(w.issuedDate) : null} />
            <Row label="Expire le" value={w.expiryDate ? formatDate(w.expiryDate) : null} />
            {w.investigation?.isPublic ? (
              <Row label="Dossier lié" value={w.investigation.caseNumber} />
            ) : null}
          </dl>

          <p className="text-xs text-navy-400">
            Toute information doit être communiquée au Federal Bureau of Investigation. Ne tentez pas
            d&apos;appréhender vous-même une personne recherchée.
          </p>
        </div>

        <div>
          <div className="rounded-lg border border-navy-200 bg-white p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-navy-700">
              Signaler une information
            </h2>
            <div className="mt-3">
              <TipForm compact />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-3 border-b border-navy-100 pb-2 last:border-0">
      <span className="text-xs uppercase tracking-wide text-navy-400">{label}</span>
      <span className="text-right text-navy-800">{value || "—"}</span>
    </div>
  );
}
