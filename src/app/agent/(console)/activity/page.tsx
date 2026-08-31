import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageTitle, DataTable } from "@/components/agent/ui";
import { Pagination } from "@/components/ui/misc";
import { formatDateTime } from "@/lib/format";

const PAGE_SIZE = 50;

export default async function ActivityLogPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string };
}) {
  await requirePermission("audit.view");
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const q = (searchParams.q ?? "").trim();

  const where = q
    ? {
        OR: [
          { summary: { contains: q, mode: "insensitive" as const } },
          { action: { contains: q, mode: "insensitive" as const } },
          { actorLabel: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  return (
    <div>
      <PageTitle title="Activity Logs" subtitle={`${total} recorded events — tamper-evident audit trail`} />
      <form className="mb-4" action="/agent/activity">
        <input name="q" defaultValue={q} placeholder="Search actions, actors, summaries…" className="field-input max-w-md" />
      </form>
      <DataTable head={["Timestamp", "Actor", "Action", "Summary", "IP"]}>
        {logs.map((l) => (
          <tr key={l.id} className="hover:bg-navy-50">
            <td className="whitespace-nowrap px-4 py-2 text-xs text-navy-500">
              {formatDateTime(l.createdAt)}
            </td>
            <td className="px-4 py-2 text-xs text-navy-700">{l.actorLabel}</td>
            <td className="px-4 py-2 font-mono text-[11px] text-navy-500">{l.action}</td>
            <td className="px-4 py-2 text-sm text-navy-800">{l.summary}</td>
            <td className="px-4 py-2 text-xs text-navy-400">{l.ip ?? "—"}</td>
          </tr>
        ))}
      </DataTable>
      <div className="mt-6">
        <Pagination
          page={page}
          totalPages={Math.ceil(total / PAGE_SIZE)}
          makeHref={(p) => `/agent/activity?${q ? `q=${q}&` : ""}page=${p}`}
        />
      </div>
    </div>
  );
}
