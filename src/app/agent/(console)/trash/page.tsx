import { redirect } from "next/navigation";
import { requireAgent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { can } from "@/lib/rbac";
import { canUseTrash } from "@/lib/soft-delete";
import { PageTitle } from "@/components/agent/ui";
import { TrashManager } from "@/components/agent/trash-manager";

export const dynamic = "force-dynamic";

export default async function TrashPage() {
  const actor = await requireAgent();
  if (!canUseTrash(actor)) redirect("/agent?error=forbidden");

  const caps = {
    investigation: can(actor, "investigation.delete"),
    person: can(actor, "suspect.delete"),
    evidence: can(actor, "evidence.delete"),
  };

  const [investigations, persons, evidence] = await Promise.all([
    caps.investigation
      ? prisma.investigation.findMany({
          where: { deletedAt: { not: null } },
          orderBy: { deletedAt: "desc" },
          select: { id: true, caseNumber: true, title: true, deletedAt: true },
        })
      : Promise.resolve([]),
    caps.person
      ? prisma.person.findMany({
          where: { deletedAt: { not: null } },
          orderBy: { deletedAt: "desc" },
          select: { id: true, fullName: true, alias: true, deletedAt: true },
        })
      : Promise.resolve([]),
    caps.evidence
      ? prisma.evidence.findMany({
          where: { deletedAt: { not: null } },
          orderBy: { deletedAt: "desc" },
          select: {
            id: true,
            evidenceNumber: true,
            title: true,
            deletedAt: true,
            investigation: { select: { caseNumber: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const data = {
    investigations: investigations.map((i) => ({
      ...i,
      deletedAt: i.deletedAt ? i.deletedAt.toISOString() : null,
    })),
    persons: persons.map((p) => ({
      ...p,
      deletedAt: p.deletedAt ? p.deletedAt.toISOString() : null,
    })),
    evidence: evidence.map((e) => ({
      id: e.id,
      evidenceNumber: e.evidenceNumber,
      title: e.title,
      deletedAt: e.deletedAt ? e.deletedAt.toISOString() : null,
      caseNumber: e.investigation?.caseNumber ?? null,
    })),
  };

  return (
    <div className="max-w-3xl">
      <PageTitle
        title="Corbeille"
        subtitle="Éléments supprimés — restaurez-les ou effacez-les définitivement"
      />
      <TrashManager data={data} caps={caps} />
    </div>
  );
}
