import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/public/page-header";
import { formatDate } from "@/lib/format";
import { NEWS_CATEGORY } from "@/lib/constants";

async function load(slug: string) {
  return prisma.news.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      author: { include: { user: true } },
      relatedInvestigation: true,
      relatedMostWanted: true,
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const a = await load(params.slug);
  if (!a) return { title: "Article not found" };
  return { title: a.title, description: a.subtitle ?? undefined };
}

export default async function NewsArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const a = await load(params.slug);
  if (!a) notFound();

  return (
    <div>
      <PageHeader
        title={a.title}
        crumbs={[
          { label: "Home", href: "/" },
          { label: "News", href: "/news" },
          { label: NEWS_CATEGORY[a.category] },
        ]}
      />
      <article className="container-fia grid gap-10 py-12 lg:grid-cols-[1fr_280px]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-federal-accent">
            {NEWS_CATEGORY[a.category]}
          </p>
          {a.subtitle ? (
            <p className="mt-2 text-xl text-navy-700">{a.subtitle}</p>
          ) : null}
          <p className="mt-2 text-sm text-navy-400">
            {formatDate(a.publishedAt)}
            {a.author ? ` · ${a.author.user.name}` : ""}
          </p>
          {a.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={a.imageUrl}
              alt=""
              className="mt-6 w-full rounded-lg border border-navy-200 object-cover"
            />
          ) : null}
          <div className="prose-fia mt-6 whitespace-pre-line">{a.content}</div>
        </div>
        <aside className="space-y-4 text-sm">
          {a.relatedMostWanted ? (
            <div className="rounded-lg border border-navy-200 bg-navy-50 p-4">
              <h3 className="font-semibold text-navy-800">Related Most Wanted</h3>
              <Link
                href={`/most-wanted/${a.relatedMostWanted.id}`}
                className="link-underline mt-1 block"
              >
                {a.relatedMostWanted.fullName}
              </Link>
            </div>
          ) : null}
          {a.relatedInvestigation?.isPublic ? (
            <div className="rounded-lg border border-navy-200 bg-navy-50 p-4">
              <h3 className="font-semibold text-navy-800">Related Investigation</h3>
              <Link
                href={`/investigations/${a.relatedInvestigation.id}`}
                className="link-underline mt-1 block"
              >
                {a.relatedInvestigation.caseNumber}
              </Link>
            </div>
          ) : null}
          <div className="rounded-lg border border-navy-200 bg-navy-50 p-4">
            <h3 className="font-semibold text-navy-800">Have information?</h3>
            <Link href="/submit-tip" className="link-underline mt-1 block">
              Submit a tip to the FIA
            </Link>
          </div>
        </aside>
      </article>
    </div>
  );
}
