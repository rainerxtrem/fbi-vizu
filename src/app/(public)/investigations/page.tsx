import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/public/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/misc";
import { formatDate } from "@/lib/format";
import { INVESTIGATION_STATUS, PRIORITY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Enquêtes",
  description: "Mises à jour publiques sur les enquêtes du Federal Bureau of Investigation.",
};

export default async function PublicInvestigationsPage() {
  const cases = await prisma.investigation.findMany({
    where: { isPublic: true },
    include: {
      leadAgent: { include: { user: true } },
      fieldOffice: true,
      _count: { select: { charges: true, persons: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Enquêtes"
        intro="Le FBI enquête sur les menaces complexes dans toutes les juridictions de San Andreas. Les affaires ci-dessous ont été rendues publiques à des fins d'information."
        crumbs={[{ label: "Accueil", href: "/" }, { label: "Enquêtes" }]}
      />
      <div className="container-fia py-10">
        <div className="mb-8 grid gap-4 sm:grid-cols-3 text-sm">
          {[
            ["Enquêtes criminelles", "Crime organisé, crime violent et entreprises criminelles."],
            ["Cybercriminalité", "Intrusions réseau, fraudes et extorsion numérique."],
            ["Criminalité financière", "Blanchiment d'argent, corruption publique et fraude."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-lg border border-navy-200 bg-navy-50 p-4">
              <h3 className="font-semibold text-navy-900">{t}</h3>
              <p className="mt-1 text-navy-600">{d}</p>
            </div>
          ))}
        </div>

        {cases.length === 0 ? (
          <EmptyState
            title="Aucune mise à jour publique pour le moment"
            description="Consultez la salle de presse pour les derniers communiqués."
          />
        ) : (
          <div className="divide-y divide-navy-100 rounded-lg border border-navy-200 bg-white">
            {cases.map((c) => (
              <Link
                key={c.id}
                href={`/investigations/${c.id}`}
                className="flex flex-col gap-2 p-5 hover:bg-navy-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-mono text-xs text-navy-400">{c.caseNumber}</p>
                  <h3 className="font-semibold text-navy-900">{c.title}</h3>
                  <p className="mt-1 line-clamp-1 text-sm text-navy-600">
                    {c.description}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone={PRIORITY[c.priority]?.tone}>{PRIORITY[c.priority]?.label}</Badge>
                  <Badge tone={INVESTIGATION_STATUS[c.status]?.tone}>
                    {INVESTIGATION_STATUS[c.status]?.label}
                  </Badge>
                  <span className="text-xs text-navy-400">{formatDate(c.updatedAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
