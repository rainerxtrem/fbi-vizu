import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { can } from "@/lib/rbac";
import { PageTitle, DataTable } from "@/components/agent/ui";
import { Badge } from "@/components/ui/badge";
import { EmptyState, Pagination } from "@/components/ui/misc";
import { InlineStatus } from "@/components/agent/inline-status";
import { APPLICATION_STATUS, APPLICATION_POSITION } from "@/lib/constants";
import { formatDate } from "@/lib/format";

const STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "INTERVIEW",
  "BACKGROUND_CHECK",
  "APPROVED",
  "REJECTED",
  "WITHDRAWN",
];
const PAGE_SIZE = 25;

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const actor = await requirePermission("applications.view");
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const status = searchParams.status;
  const where = status ? { status: status as never } : {};

  const [total, rows] = await Promise.all([
    prisma.application.count({ where }),
    prisma.application.findMany({
      where,
      include: { assignedRecruiter: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const canReview = can(actor, "applications.review");
  const canRecruit = can(actor, "agents.manage");
  const hiredAppIds = new Set(
    (await prisma.agent.findMany({
      where: { applicationId: { not: null } },
      select: { applicationId: true },
    })).map((a) => a.applicationId),
  );

  const mkHref = (p: number) => {
    const sp = new URLSearchParams();
    if (status) sp.set("status", status);
    sp.set("page", String(p));
    return `/agent/applications?${sp.toString()}`;
  };

  return (
    <div>
      <PageTitle
        title="Candidatures"
        subtitle={`${total} candidature${total === 1 ? "" : "s"}`}
      />
      <form className="mb-4" action="/agent/applications">
        <select name="status" defaultValue={status ?? ""} className="field-input w-auto">
          <option value="">Tout statut</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {APPLICATION_STATUS[s]?.label ?? s}
            </option>
          ))}
        </select>
      </form>
      {rows.length === 0 ? (
        <EmptyState title="Aucune candidature pour ces critères" />
      ) : (
        <>
        <DataTable head={["Réf", "Candidat", "Poste", "Soumise le", "Recruteur", "Statut", ""]}>
          {rows.map((a) => (
            <tr key={a.id} className="hover:bg-navy-50">
              <td className="px-4 py-2.5 font-mono text-xs text-navy-500">{a.publicId}</td>
              <td className="px-4 py-2.5">
                <p className="font-medium text-navy-900">
                  {a.firstName} {a.lastName}
                </p>
                <p className="text-xs text-navy-500">{a.email}</p>
              </td>
              <td className="px-4 py-2.5 text-navy-600">{APPLICATION_POSITION[a.position]}</td>
              <td className="px-4 py-2.5 text-xs text-navy-500">{formatDate(a.createdAt)}</td>
              <td className="px-4 py-2.5 text-navy-600">
                {a.assignedRecruiter?.user.name ?? "—"}
              </td>
              <td className="px-4 py-2.5">
                {canReview ? (
                  <InlineStatus
                    endpoint={`/api/applications/${a.id}`}
                    value={a.status}
                    options={STATUSES}
                  />
                ) : (
                  <Badge tone={APPLICATION_STATUS[a.status]?.tone}>
                    {APPLICATION_STATUS[a.status]?.label}
                  </Badge>
                )}
              </td>
              <td className="px-4 py-2.5 text-right">
                {canRecruit && a.status === "APPROVED" && !hiredAppIds.has(a.id) ? (
                  <Link
                    href={`/agent/agents/new?application=${a.id}`}
                    className="text-xs font-semibold uppercase text-navy-700 hover:underline"
                  >
                    Recruter
                  </Link>
                ) : hiredAppIds.has(a.id) ? (
                  <span className="text-xs text-navy-400">Recruté</span>
                ) : null}
              </td>
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
