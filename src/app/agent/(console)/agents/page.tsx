import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { can, RANK_LABELS, type Rank } from "@/lib/rbac";
import { PageTitle, DataTable } from "@/components/agent/ui";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, Pagination } from "@/components/ui/misc";
import { AGENT_STATUS } from "@/lib/constants";

const PAGE_SIZE = 25;

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const actor = await requirePermission("agents.view");
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const q = (searchParams.q ?? "").trim();
  const status = searchParams.status;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (q)
    where.OR = [
      { badgeNumber: { contains: q, mode: "insensitive" } },
      { title: { contains: q, mode: "insensitive" } },
      { user: { name: { contains: q, mode: "insensitive" } } },
    ];

  const [total, agents] = await Promise.all([
    prisma.agent.count({ where }),
    prisma.agent.findMany({
      where,
      include: { user: true, fieldOffice: true, _count: { select: { ledInvestigations: true } } },
      orderBy: [{ rank: "desc" }, { user: { name: "asc" } }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const mkHref = (p: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (status) sp.set("status", status);
    sp.set("page", String(p));
    return `/agent/agents?${sp.toString()}`;
  };

  return (
    <div>
      <PageTitle
        title="Agents"
        subtitle={`${total} membre${total === 1 ? "" : "s"} du personnel`}
        action={
          can(actor, "agents.manage") ? (
            <ButtonLink href="/agent/agents/new" size="sm">
              + Nouvel agent
            </ButtonLink>
          ) : null
        }
      />

      <form className="mb-4 flex flex-wrap gap-2" action="/agent/agents">
        <input
          name="q"
          defaultValue={q}
          placeholder="Nom, matricule, fonction…"
          className="field-input max-w-xs"
        />
        <select name="status" defaultValue={status ?? ""} className="field-input w-auto">
          <option value="">Tout statut</option>
          {Object.entries(AGENT_STATUS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </form>

      {agents.length === 0 ? (
        <EmptyState title="Aucun agent trouvé" />
      ) : (
        <>
          <DataTable head={["Nom", "Matricule", "Grade", "Field Office", "Statut", "Dossiers dirigés"]}>
            {agents.map((a) => (
              <tr key={a.id} className="hover:bg-navy-50">
                <td className="px-4 py-2.5">
                  <Link href={`/agent/agents/${a.id}`} className="font-medium text-navy-900 hover:underline">
                    {a.user.name}
                  </Link>
                  <p className="text-xs text-navy-500">{a.title}</p>
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-navy-500">{a.badgeNumber}</td>
                <td className="px-4 py-2.5 text-navy-700">{RANK_LABELS[a.rank as Rank]}</td>
                <td className="px-4 py-2.5 text-navy-600">{a.fieldOffice?.name ?? "QG"}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={a.status === "ACTIVE" ? "green" : "amber"}>
                    {AGENT_STATUS[a.status] ?? a.status}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-navy-600">{a._count.ledInvestigations}</td>
              </tr>
            ))}
          </DataTable>
          <div className="mt-6">
            <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} makeHref={mkHref} />
          </div>
        </>
      )}
    </div>
  );
}
