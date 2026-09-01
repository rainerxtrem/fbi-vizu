import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageTitle, DataTable } from "@/components/agent/ui";
import { Pagination, EmptyState } from "@/components/ui/misc";
import { formatDateTime } from "@/lib/format";

const PAGE_SIZE = 50;

export default async function ActivityLogPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string; actor?: string; entity?: string; from?: string; to?: string };
}) {
  await requirePermission("audit.view");
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const q = (searchParams.q ?? "").trim();
  const actor = (searchParams.actor ?? "").trim();
  const entity = (searchParams.entity ?? "").trim();
  const from = searchParams.from;
  const to = searchParams.to;

  const and: object[] = [];
  if (q)
    and.push({
      OR: [
        { summary: { contains: q, mode: "insensitive" as const } },
        { action: { contains: q, mode: "insensitive" as const } },
      ],
    });
  if (actor) and.push({ actorLabel: { contains: actor, mode: "insensitive" as const } });
  if (entity) and.push({ entityType: entity });
  if (from) and.push({ createdAt: { gte: new Date(from) } });
  if (to) and.push({ createdAt: { lte: new Date(`${to}T23:59:59`) } });
  const where = and.length ? { AND: and } : {};

  const [total, logs, entityTypes] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.findMany({
      where: { entityType: { not: null } },
      distinct: ["entityType"],
      select: { entityType: true },
    }),
  ]);

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries({ q, actor, entity, from, to })) if (v) qs.set(k, v);
  const csvHref = `/api/activity/export?${qs.toString()}`;

  return (
    <div>
      <PageTitle
        title="Journal d'activité"
        subtitle={`${total} événement${total === 1 ? "" : "s"} — journal d'audit infalsifiable`}
        action={
          <Link
            href={csvHref}
            className="rounded-md border border-navy-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-navy-700 hover:bg-navy-50"
          >
            Exporter en CSV
          </Link>
        }
      />

      <form className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5" action="/agent/activity">
        <input name="q" defaultValue={q} placeholder="Action, résumé…" className="field-input" />
        <input name="actor" defaultValue={actor} placeholder="Acteur" className="field-input" />
        <select name="entity" defaultValue={entity} className="field-input">
          <option value="">Tout type d&apos;entité</option>
          {entityTypes
            .map((e) => e.entityType!)
            .sort()
            .map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
        </select>
        <input name="from" type="date" defaultValue={from} className="field-input" />
        <input name="to" type="date" defaultValue={to} className="field-input" />
        <div className="sm:col-span-2 lg:col-span-5">
          <button className="rounded-md bg-navy-800 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">
            Filtrer
          </button>
        </div>
      </form>

      {logs.length === 0 ? (
        <EmptyState title="Aucun événement pour ces critères" />
      ) : (
        <>
          <DataTable head={["Horodatage", "Acteur", "Action", "Résumé", "IP"]}>
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
              makeHref={(p) => {
                const sp = new URLSearchParams(qs);
                sp.set("page", String(p));
                return `/agent/activity?${sp.toString()}`;
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
