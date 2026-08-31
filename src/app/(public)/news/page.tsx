import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/public/page-header";
import { Pagination, EmptyState } from "@/components/ui/misc";
import { formatDate } from "@/lib/format";
import { NEWS_CATEGORY } from "@/lib/constants";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Newsroom" };

const PAGE_SIZE = 9;

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const category = searchParams.category;

  const where: Prisma.NewsWhereInput = { status: "PUBLISHED" };
  if (category && NEWS_CATEGORY[category]) {
    where.category = category as Prisma.NewsWhereInput["category"];
  }

  const [total, articles] = await Promise.all([
    prisma.news.count({ where }),
    prisma.news.findMany({
      where,
      include: { author: { include: { user: true } } },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="FIA Newsroom"
        intro="Press releases, case updates, and public notices from the Federal Investigative Agency."
        crumbs={[{ label: "Home", href: "/" }, { label: "News" }]}
      />
      <div className="container-fia py-10">
        <div className="mb-8 flex flex-wrap gap-2">
          <CatLink label="All" href="/news" active={!category} />
          {Object.entries(NEWS_CATEGORY).map(([k, v]) => (
            <CatLink
              key={k}
              label={v}
              href={`/news?category=${k}`}
              active={category === k}
            />
          ))}
        </div>

        {articles.length === 0 ? (
          <EmptyState title="No articles published yet" />
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((a) => (
                <Link
                  key={a.id}
                  href={`/news/${a.slug}`}
                  className="group flex flex-col overflow-hidden rounded-lg border border-navy-200 bg-white"
                >
                  <div className="aspect-[16/9] overflow-hidden bg-navy-100">
                    {a.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.imageUrl}
                        alt=""
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-federal-accent">
                      {NEWS_CATEGORY[a.category]}
                    </p>
                    <h3 className="mt-1 font-semibold leading-snug text-navy-900 group-hover:text-federal-accent">
                      {a.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm text-navy-600">
                      {a.subtitle}
                    </p>
                    <p className="mt-auto pt-3 text-xs text-navy-400">
                      {formatDate(a.publishedAt)}
                      {a.author ? ` · ${a.author.user.name}` : ""}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-10">
              <Pagination
                page={page}
                totalPages={Math.ceil(total / PAGE_SIZE)}
                makeHref={(p) =>
                  `/news?${category ? `category=${category}&` : ""}page=${p}`
                }
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CatLink({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        active
          ? "border-navy-800 bg-navy-800 text-white"
          : "border-navy-200 text-navy-600 hover:bg-navy-50",
      )}
    >
      {label}
    </Link>
  );
}
