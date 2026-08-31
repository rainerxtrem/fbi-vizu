import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { can } from "@/lib/rbac";
import { PageTitle, DataTable } from "@/components/agent/ui";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, Pagination } from "@/components/ui/misc";
import { RISK_LEVEL } from "@/lib/constants";
import { ageFromDob, formatDate } from "@/lib/format";

const PAGE_SIZE = 20;

export default async function SuspectsPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const actor = await requirePermission("suspect.view");
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const q = (searchParams.q ?? "").trim();
  const risk = searchParams.risk;

  const where: Record<string, unknown> = {};
  if (risk) where.riskLevel = risk;
  if (q)
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { alias: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];

  const [total, rows] = await Promise.all([
    prisma.person.count({ where }),
    prisma.person.findMany({
      where,
      include: { _count: { select: { investigations: true, warrants: true, mostWanted: true } } },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  return (
    <div>
      <PageTitle
        title="Suspects & Persons"
        subtitle={`${total} person records`}
        action={
          can(actor, "suspect.create") ? (
            <ButtonLink href="/agent/suspects/new" size="sm">
              + Create Suspect
            </ButtonLink>
          ) : null
        }
      />

      <form className="mb-4 flex gap-2" action="/agent/suspects">
        <input name="q" defaultValue={q} placeholder="Search name, alias, description…" className="field-input max-w-sm" />
        <select name="risk" defaultValue={risk ?? ""} className="field-input w-auto">
          <option value="">Any risk</option>
          {["LOW", "MEDIUM", "HIGH", "EXTREME"].map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </form>

      {rows.length === 0 ? (
        <EmptyState title="No person records found" />
      ) : (
        <>
          <DataTable head={["Name", "Alias", "Age", "Risk", "Cases", "Updated"]}>
            {rows.map((p) => (
              <tr key={p.id} className="hover:bg-navy-50">
                <td className="px-4 py-2.5">
                  <Link href={`/agent/suspects/${p.id}`} className="font-medium text-navy-900 hover:underline">
                    {p.fullName}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-navy-600">{p.alias ?? "—"}</td>
                <td className="px-4 py-2.5 text-navy-600">{ageFromDob(p.dob) ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={RISK_LEVEL[p.riskLevel]?.tone}>{RISK_LEVEL[p.riskLevel]?.label}</Badge>
                </td>
                <td className="px-4 py-2.5 text-navy-600">{p._count.investigations}</td>
                <td className="px-4 py-2.5 text-xs text-navy-500">{formatDate(p.updatedAt)}</td>
              </tr>
            ))}
          </DataTable>
          <div className="mt-6">
            <Pagination
              page={page}
              totalPages={Math.ceil(total / PAGE_SIZE)}
              makeHref={(p) => `/agent/suspects?${q ? `q=${q}&` : ""}${risk ? `risk=${risk}&` : ""}page=${p}`}
            />
          </div>
        </>
      )}
    </div>
  );
}
