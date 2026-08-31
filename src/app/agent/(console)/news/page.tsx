import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { can } from "@/lib/rbac";
import { PageTitle, DataTable } from "@/components/agent/ui";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { InlineStatus } from "@/components/agent/inline-status";
import { NEWS_CATEGORY } from "@/lib/constants";
import { formatDate } from "@/lib/format";

export default async function AgentNewsPage() {
  const actor = await requirePermission("news.view");
  const rows = await prisma.news.findMany({
    include: { author: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageTitle
        title="Newsroom"
        subtitle={`${rows.length} articles`}
        action={
          can(actor, "news.create") ? (
            <ButtonLink href="/agent/news/new" size="sm">
              + Create News Article
            </ButtonLink>
          ) : null
        }
      />
      {rows.length === 0 ? (
        <EmptyState title="No articles yet" />
      ) : (
        <DataTable head={["Title", "Category", "Author", "Created", "Status"]}>
          {rows.map((a) => (
            <tr key={a.id} className="hover:bg-navy-50">
              <td className="px-4 py-2.5">
                {a.status === "PUBLISHED" ? (
                  <Link href={`/news/${a.slug}`} target="_blank" className="font-medium text-navy-900 hover:underline">
                    {a.title}
                  </Link>
                ) : (
                  <span className="font-medium text-navy-900">{a.title}</span>
                )}
              </td>
              <td className="px-4 py-2.5 text-navy-600">{NEWS_CATEGORY[a.category]}</td>
              <td className="px-4 py-2.5 text-navy-600">{a.author?.user.name ?? "—"}</td>
              <td className="px-4 py-2.5 text-xs text-navy-500">{formatDate(a.createdAt)}</td>
              <td className="px-4 py-2.5">
                {can(actor, "news.edit") ? (
                  <InlineStatus
                    endpoint={`/api/news/${a.id}`}
                    value={a.status}
                    options={
                      can(actor, "news.publish")
                        ? ["DRAFT", "PUBLISHED", "ARCHIVED"]
                        : ["DRAFT", "ARCHIVED"]
                    }
                  />
                ) : (
                  <Badge tone={a.status === "PUBLISHED" ? "green" : "slate"}>{a.status}</Badge>
                )}
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
