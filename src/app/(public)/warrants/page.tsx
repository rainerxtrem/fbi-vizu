import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/public/page-header";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { WARRANT_STATUS, WARRANT_TYPE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Mandats publics",
  description: "Avis de mandats émis par le Federal Bureau of Investigation.",
};

export default async function PublicWarrantsPage() {
  const warrants = await prisma.warrant.findMany({
    where: { isPublic: true, investigation: { deletedAt: null } },
    include: { person: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Mandats"
        intro="Avis publics de mandats émis dans le cadre d'enquêtes fédérales. Communiquez toute information au FBI."
        crumbs={[{ label: "Accueil", href: "/" }, { label: "Mandats" }]}
      />
      <div className="container-fia py-12">
        {warrants.length === 0 ? (
          <p className="text-navy-500">Aucun mandat public pour le moment.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {warrants.map((w) => (
              <Link
                key={w.id}
                href={`/warrants/${encodeURIComponent(w.warrantNumber)}`}
                className="block rounded-lg border border-navy-200 bg-white p-5 hover:border-navy-400"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-navy-500">{w.warrantNumber}</span>
                  <Badge tone={WARRANT_STATUS[w.status]?.tone}>
                    {WARRANT_STATUS[w.status]?.label ?? w.status}
                  </Badge>
                </div>
                <p className="mt-2 text-lg font-bold text-navy-900">
                  {w.person?.fullName ?? WARRANT_TYPE[w.type] ?? w.type}
                </p>
                <p className="text-sm text-navy-500">
                  {WARRANT_TYPE[w.type] ?? w.type}
                  {w.issuedDate ? ` · émis le ${formatDate(w.issuedDate)}` : ""}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
