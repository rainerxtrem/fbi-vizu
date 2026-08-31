import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { investigationVisibilityFilter, can } from "@/lib/rbac";
import { PageTitle, DataTable } from "@/components/agent/ui";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Pagination, EmptyState } from "@/components/ui/misc";
import { formatDate } from "@/lib/format";
import { INVESTIGATION_STATUS, PRIORITY, CLASSIFICATION } from "@/lib/constants";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 20;

export default async function InvestigationsListPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const actor = await requirePermission("investigation.view");
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const status = searchParams.status;
  const priority = searchParams.priority;
  const q = (searchParams.q ?? "").trim();

  const and: object[] = [investigationVisibilityFilter(actor)];
  if (status) and.push({ status });
  if (priority) and.push({ priority: priority === "HIGH" ? { in: ["HIGH", "CRITICAL"] } : priority });
  if (q)
    and.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { caseNumber: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    });

  const where = { AND: and };
  const [total, rows] = await Promise.all([
    prisma.investigation.count({ where }),
    prisma.investigation.findMany({
      where,
      include: {
        leadAgent: { include: { user: true } },
        fieldOffice: true,
        _count: { select: { assignedAgents: true, evidence: true } },
      },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const mkHref = (patch: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    const merged = { ...searchParams, ...patch, page: undefined };
    for (const [k, v] of Object.entries(merged)) if (v) sp.set(k, v);
    return `/agent/investigations?${sp.toString()}`;
  };

  const statusTabs = ["ALL", "OPEN", "ACTIVE", "SUSPENDED", "CLOSED", "ARCHIVED"];
  const tabLabel = (s: string) =>
    s === "ALL" ? "Toutes" : INVESTIGATION_STATUS[s].label;

  return (
    <div>
      <PageTitle
        title="Toutes les enquêtes"
        subtitle={`${total} dossier${total === 1 ? "" : "s"} visible${total === 1 ? "" : "s"} pour vous`}
        action={
          can(actor, "investigation.create") ? (
            <ButtonLink href="/agent/investigations/new" size="sm">
              + Créer une enquête
            </ButtonLink>
          ) : null
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {statusTabs.map((s) => (
          <Link
            key={s}
            href={mkHref({ status: s === "ALL" ? undefined : s })}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold uppercase",
              (status ?? "ALL") === s
                ? "border-navy-800 bg-navy-800 text-white"
                : "border-navy-200 text-navy-600 hover:bg-navy-50",
            )}
          >
            {tabLabel(s)}
          </Link>
        ))}
      </div>

      <form className="mb-4" action="/agent/investigations">
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <input
          name="q"
          defaultValue={q}
          placeholder="Rechercher par titre, Case Number, description…"
          className="field-input max-w-md"
        />
      </form>

      {rows.length === 0 ? (
        <EmptyState title="Aucune enquête trouvée" description="Ajustez vos filtres ou créez un nouveau dossier." />
      ) : (
        <>
          <DataTable head={["Case", "Titre", "Responsable", "Priorité", "Statut", "Class.", "Maj"]}>
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-navy-50">
                <td className="px-4 py-2.5 font-mono text-xs text-navy-500">
                  <Link href={`/agent/investigations/${r.id}`} className="hover:underline">
                    {r.caseNumber}
                  </Link>
                </td>
                <td className="px-4 py-2.5">
                  <Link href={`/agent/investigations/${r.id}`} className="font-medium text-navy-900 hover:underline">
                    {r.title}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-navy-600">
                  {r.leadAgent?.user.name ?? "—"}
                </td>
                <td className="px-4 py-2.5">
                  <Badge tone={PRIORITY[r.priority]?.tone}>{PRIORITY[r.priority]?.label}</Badge>
                </td>
                <td className="px-4 py-2.5">
                  <Badge tone={INVESTIGATION_STATUS[r.status]?.tone}>
                    {INVESTIGATION_STATUS[r.status]?.label}
                  </Badge>
                </td>
                <td className="px-4 py-2.5">
                  <Badge tone={CLASSIFICATION[r.classification]?.tone}>
                    {CLASSIFICATION[r.classification]?.label}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-xs text-navy-500">{formatDate(r.updatedAt)}</td>
              </tr>
            ))}
          </DataTable>
          <div className="mt-6">
            <Pagination
              page={page}
              totalPages={Math.ceil(total / PAGE_SIZE)}
              makeHref={(p) => {
                const sp = new URLSearchParams();
                for (const [k, v] of Object.entries(searchParams)) if (v) sp.set(k, v);
                sp.set("page", String(p));
                return `/agent/investigations?${sp.toString()}`;
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
