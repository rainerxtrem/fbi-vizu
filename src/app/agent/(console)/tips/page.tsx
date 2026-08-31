import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { can } from "@/lib/rbac";
import { PageTitle, DataTable } from "@/components/agent/ui";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/misc";
import { InlineStatus } from "@/components/agent/inline-status";
import { TIP_STATUS } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";

const STATUSES = ["NEW", "REVIEWING", "ASSIGNED", "ACTIONED", "CLOSED", "ARCHIVED"];

export default async function TipsPage() {
  const actor = await requirePermission("tips.view");
  const agentId = actor.agent?.id ?? "__none__";

  const where = can(actor, "tips.view.all")
    ? {}
    : {
        OR: [
          { assignedToId: agentId },
          { investigation: { leadAgentId: agentId } },
          { investigation: { assignedAgents: { some: { agentId } } } },
        ],
      };

  const rows = await prisma.tip.findMany({
    where,
    include: { mostWanted: true, assignedTo: { include: { user: true } }, file: true },
    orderBy: { createdAt: "desc" },
  });

  const canAssign = can(actor, "tips.assign");

  return (
    <div>
      <PageTitle title="Tips" subtitle={`${rows.length} tips in your queue`} />
      {rows.length === 0 ? (
        <EmptyState title="No tips" description="Public tips will appear here as they are submitted." />
      ) : (
        <DataTable head={["Ref", "Subject", "From", "Related", "Received", "Status"]}>
          {rows.map((t) => (
            <tr key={t.id} className="hover:bg-navy-50">
              <td className="px-4 py-2.5 font-mono text-xs text-navy-500">{t.publicId}</td>
              <td className="px-4 py-2.5">
                <p className="font-medium text-navy-900">{t.subject}</p>
                <p className="line-clamp-1 max-w-md text-xs text-navy-500">{t.description}</p>
                {t.file ? (
                  <a href={t.file.url} target="_blank" className="text-xs text-navy-600 underline">
                    Attachment
                  </a>
                ) : null}
              </td>
              <td className="px-4 py-2.5 text-xs text-navy-600">
                {t.anonymous ? "Anonymous" : t.name || t.email || "—"}
              </td>
              <td className="px-4 py-2.5 text-xs">
                {t.mostWanted ? (
                  <Link href={`/agent/most-wanted/${t.mostWanted.id}`} className="link-underline">
                    {t.mostWanted.publicId}
                  </Link>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-2.5 text-xs text-navy-500">{formatDateTime(t.createdAt)}</td>
              <td className="px-4 py-2.5">
                {canAssign ? (
                  <InlineStatus endpoint={`/api/tips/${t.id}`} value={t.status} options={STATUSES} />
                ) : (
                  <Badge tone={TIP_STATUS[t.status]?.tone}>{TIP_STATUS[t.status]?.label}</Badge>
                )}
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
