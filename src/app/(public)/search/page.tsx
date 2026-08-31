import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/public/page-header";
import { EmptyState } from "@/components/ui/misc";
import { NEWS_CATEGORY } from "@/lib/constants";

export const metadata: Metadata = { title: "Rechercher" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q ?? "").trim();

  const [mostWanted, news, investigations] = q
    ? await Promise.all([
        prisma.mostWanted.findMany({
          where: {
            status: { in: ["PUBLISHED", "CAPTURED", "LOCATED"] },
            OR: [
              { fullName: { contains: q, mode: "insensitive" } },
              { aliases: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
              { lastKnownLocation: { contains: q, mode: "insensitive" } },
            ],
          },
          take: 12,
        }),
        prisma.news.findMany({
          where: {
            status: "PUBLISHED",
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { subtitle: { contains: q, mode: "insensitive" } },
              { content: { contains: q, mode: "insensitive" } },
            ],
          },
          take: 12,
        }),
        prisma.investigation.findMany({
          where: {
            isPublic: true,
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
              { caseNumber: { contains: q, mode: "insensitive" } },
            ],
          },
          take: 12,
        }),
      ])
    : [[], [], []];

  const total = mostWanted.length + news.length + investigations.length;

  return (
    <div>
      <PageHeader
        title="Résultats de recherche"
        intro={q ? `Résultats pour « ${q} »` : "Saisissez un terme de recherche."}
        crumbs={[{ label: "Accueil", href: "/" }, { label: "Rechercher" }]}
      />
      <div className="container-fia space-y-10 py-10">
        {!q ? null : total === 0 ? (
          <EmptyState title="Aucun résultat" description="Essayez d'autres mots-clés." />
        ) : (
          <>
            {mostWanted.length > 0 && (
              <Group title="Most Wanted">
                {mostWanted.map((m) => (
                  <Result
                    key={m.id}
                    href={`/most-wanted/${m.id}`}
                    title={m.fullName}
                    meta={m.lastKnownLocation ?? m.publicId}
                  />
                ))}
              </Group>
            )}
            {investigations.length > 0 && (
              <Group title="Enquêtes">
                {investigations.map((i) => (
                  <Result
                    key={i.id}
                    href={`/investigations/${i.id}`}
                    title={i.title}
                    meta={i.caseNumber}
                  />
                ))}
              </Group>
            )}
            {news.length > 0 && (
              <Group title="Actualités">
                {news.map((n) => (
                  <Result
                    key={n.id}
                    href={`/news/${n.slug}`}
                    title={n.title}
                    meta={NEWS_CATEGORY[n.category]}
                  />
                ))}
              </Group>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold uppercase tracking-wide text-navy-800">{title}</h2>
      <div className="mt-3 divide-y divide-navy-100 rounded-lg border border-navy-200 bg-white">
        {children}
      </div>
    </section>
  );
}

function Result({ href, title, meta }: { href: string; title: string; meta: string }) {
  return (
    <Link href={href} className="flex items-center justify-between p-4 hover:bg-navy-50">
      <span className="font-medium text-navy-900">{title}</span>
      <span className="text-xs text-navy-400">{meta}</span>
    </Link>
  );
}
