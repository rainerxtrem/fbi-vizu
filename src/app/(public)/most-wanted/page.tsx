import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { MostWantedCard } from "@/components/public/most-wanted-card";
import { MostWantedFilters } from "@/components/public/most-wanted-filters";
import { Pagination, EmptyState, Breadcrumbs } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "Most Wanted",
  description:
    "Individuals wanted by the Federal Investigative Agency for serious federal offenses across San Andreas.",
};

const PAGE_SIZE = 12;

export default async function MostWantedPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const q = (searchParams.q ?? "").trim();
  const category = searchParams.category ?? "ALL";
  const status = searchParams.status ?? "ALL";
  const sort = searchParams.sort ?? "danger";

  const where: Prisma.MostWantedWhereInput = {
    status:
      status === "ALL"
        ? { in: ["PUBLISHED", "CAPTURED", "LOCATED"] }
        : (status as Prisma.MostWantedWhereInput["status"]),
  };
  if (category !== "ALL") {
    where.category = category as Prisma.MostWantedWhereInput["category"];
  }
  if (q) {
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { aliases: { contains: q, mode: "insensitive" } },
      { lastKnownLocation: { contains: q, mode: "insensitive" } },
      { caseNumber: { contains: q, mode: "insensitive" } },
      { publicId: { contains: q, mode: "insensitive" } },
    ];
  }

  const orderBy: Prisma.MostWantedOrderByWithRelationInput[] =
    sort === "reward"
      ? [{ reward: "desc" }]
      : sort === "recent"
        ? [{ publishedAt: "desc" }]
        : sort === "name"
          ? [{ fullName: "asc" }]
          : [{ dangerLevel: "desc" }, { reward: "desc" }];

  const [total, results] = await Promise.all([
    prisma.mostWanted.count({ where }),
    prisma.mostWanted.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const makeHref = (p: number) => {
    const sp = new URLSearchParams(
      Object.entries(searchParams).filter(([, v]) => v) as [string, string][],
    );
    sp.set("page", String(p));
    return `/most-wanted?${sp.toString()}`;
  };

  return (
    <div className="bg-navy-50/40">
      <div className="border-b border-navy-200 bg-navy-900 text-white">
        <div className="container-fia py-12">
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: "Most Wanted" }]}
          />
          <h1 className="mt-3 text-4xl font-bold">Most Wanted</h1>
          <p className="mt-2 max-w-2xl text-navy-200">
            The FIA is seeking the public&apos;s assistance in locating the
            following individuals. If you have information, contact your nearest
            field office or submit a tip. Do not attempt to apprehend any of
            these individuals.
          </p>
        </div>
      </div>

      <div className="container-fia grid gap-8 py-10 lg:grid-cols-[280px_1fr]">
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <MostWantedFilters />
        </aside>

        <div>
          <p className="mb-4 text-sm text-navy-500">
            {total} {total === 1 ? "result" : "results"}
            {q ? ` for “${q}”` : ""}
          </p>
          {results.length === 0 ? (
            <EmptyState
              title="No individuals match your search"
              description="Try adjusting your filters or search terms."
            />
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((mw) => (
                  <MostWantedCard key={mw.id} mw={mw} />
                ))}
              </div>
              <div className="mt-10">
                <Pagination page={page} totalPages={totalPages} makeHref={makeHref} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
