import Link from "next/link";
import { requireAgent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageTitle, DataTable } from "@/components/agent/ui";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/misc";
import { formatDate } from "@/lib/format";
import { INVESTIGATION_STATUS, PRIORITY } from "@/lib/constants";

export default async function MyInvestigationsPage() {
  const actor = await requireAgent();
  const agentId = actor.agent?.id ?? "__none__";

  const rows = await prisma.investigation.findMany({
    where: {
      deletedAt: null,
      OR: [
        { leadAgentId: agentId },
        { assignedAgents: { some: { agentId } } },
      ],
    },
    include: { leadAgent: { include: { user: true } } },
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
  });

  return (
    <div>
      <PageTitle title="Mes enquêtes" subtitle={`${rows.length} qui vous sont affectées`} />
      {rows.length === 0 ? (
        <EmptyState title="Vous n'avez aucune enquête affectée" />
      ) : (
        <DataTable head={["Case", "Titre", "Rôle", "Priorité", "Statut", "Maj"]}>
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
              <td className="px-4 py-2.5 text-xs text-navy-600">
                {r.leadAgentId === agentId ? "Agent responsable" : "Agent affecté"}
              </td>
              <td className="px-4 py-2.5">
                <Badge tone={PRIORITY[r.priority]?.tone}>{PRIORITY[r.priority]?.label}</Badge>
              </td>
              <td className="px-4 py-2.5">
                <Badge tone={INVESTIGATION_STATUS[r.status]?.tone}>
                  {INVESTIGATION_STATUS[r.status]?.label}
                </Badge>
              </td>
              <td className="px-4 py-2.5 text-xs text-navy-500">{formatDate(r.updatedAt)}</td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
