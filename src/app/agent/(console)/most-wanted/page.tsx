import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageTitle, DataTable } from "@/components/agent/ui";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/misc";
import { MOST_WANTED_STATUS, MOST_WANTED_CATEGORY, DANGER_LEVEL } from "@/lib/constants";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/cn";

export default async function AgentMostWantedPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  await requirePermission("mostwanted.view");
  const status = searchParams.status;
  const where = status ? { status: status as never } : {};

  const rows = await prisma.mostWanted.findMany({
    where,
    include: { createdBy: { include: { user: true } }, investigation: true },
    orderBy: { updatedAt: "desc" },
  });

  const tabs = ["ALL", ...Object.keys(MOST_WANTED_STATUS)];

  return (
    <div>
      <PageTitle title="Most Wanted Bulletins" subtitle={`${rows.length} records`} />
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t}
            href={t === "ALL" ? "/agent/most-wanted" : `/agent/most-wanted?status=${t}`}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold uppercase",
              (status ?? "ALL") === t
                ? "border-navy-800 bg-navy-800 text-white"
                : "border-navy-200 text-navy-600 hover:bg-navy-50",
            )}
          >
            {t === "ALL" ? "All" : MOST_WANTED_STATUS[t].label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No bulletins" description="Create one from an investigation." />
      ) : (
        <DataTable head={["ID", "Name", "Category", "Danger", "Reward", "Status", "Updated"]}>
          {rows.map((mw) => (
            <tr key={mw.id} className="hover:bg-navy-50">
              <td className="px-4 py-2.5 font-mono text-xs text-navy-500">
                <Link href={`/agent/most-wanted/${mw.id}`} className="hover:underline">
                  {mw.publicId}
                </Link>
              </td>
              <td className="px-4 py-2.5">
                <Link href={`/agent/most-wanted/${mw.id}`} className="font-medium text-navy-900 hover:underline">
                  {mw.fullName}
                </Link>
              </td>
              <td className="px-4 py-2.5 text-navy-600">{MOST_WANTED_CATEGORY[mw.category]}</td>
              <td className="px-4 py-2.5">
                <Badge tone={DANGER_LEVEL[mw.dangerLevel]?.tone}>{DANGER_LEVEL[mw.dangerLevel]?.label}</Badge>
              </td>
              <td className="px-4 py-2.5 text-navy-600">{mw.reward ? formatMoney(mw.reward) : "—"}</td>
              <td className="px-4 py-2.5">
                <Badge tone={MOST_WANTED_STATUS[mw.status]?.tone}>{MOST_WANTED_STATUS[mw.status]?.label}</Badge>
              </td>
              <td className="px-4 py-2.5 text-xs text-navy-500">{formatDate(mw.updatedAt)}</td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
