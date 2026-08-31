import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageTitle, DataTable } from "@/components/agent/ui";
import { Badge } from "@/components/ui/badge";
import { RANK_LABELS, RANK_ORDER, type Rank } from "@/lib/rbac";

export default async function AgentsPage() {
  await requirePermission("agents.view");
  const agents = await prisma.agent.findMany({
    include: { user: true, fieldOffice: true, _count: { select: { ledInvestigations: true } } },
  });

  agents.sort((a, b) => RANK_ORDER.indexOf(b.rank as Rank) - RANK_ORDER.indexOf(a.rank as Rank));

  return (
    <div>
      <PageTitle title="Agents" subtitle={`${agents.length} personnel on the roster`} />
      <DataTable head={["Name", "Badge", "Rank", "Field Office", "Status", "Cases Led"]}>
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
            <td className="px-4 py-2.5 text-navy-600">{a.fieldOffice?.name ?? "HQ"}</td>
            <td className="px-4 py-2.5">
              <Badge tone={a.status === "ACTIVE" ? "green" : "amber"}>{a.status}</Badge>
            </td>
            <td className="px-4 py-2.5 text-navy-600">{a._count.ledInvestigations}</td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
