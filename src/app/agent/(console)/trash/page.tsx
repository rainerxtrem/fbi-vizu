import { redirect } from "next/navigation";
import { requireAgent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { can } from "@/lib/rbac";
import { canUseTrash } from "@/lib/soft-delete";
import { PageTitle } from "@/components/agent/ui";
import { TrashManager } from "@/components/agent/trash-manager";

export const dynamic = "force-dynamic";

const deleted = { deletedAt: { not: null } } as const;

export default async function TrashPage() {
  const actor = await requireAgent();
  if (!canUseTrash(actor)) redirect("/agent?error=forbidden");

  const caps = {
    investigation: can(actor, "investigation.delete"),
    person: can(actor, "suspect.delete"),
    evidence: can(actor, "evidence.delete"),
    warrant: can(actor, "warrant.delete"),
    arrest: can(actor, "arrest.delete"),
  };

  const [investigations, persons, evidence, warrants, arrests] = await Promise.all([
    caps.investigation
      ? prisma.investigation.findMany({
          where: deleted,
          orderBy: { deletedAt: "desc" },
          select: { id: true, caseNumber: true, title: true, deletedAt: true },
        })
      : Promise.resolve([]),
    caps.person
      ? prisma.person.findMany({
          where: deleted,
          orderBy: { deletedAt: "desc" },
          select: { id: true, fullName: true, alias: true, deletedAt: true },
        })
      : Promise.resolve([]),
    caps.evidence
      ? prisma.evidence.findMany({
          where: deleted,
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
    caps.warrant
      ? prisma.warrant.findMany({
          where: deleted,
          orderBy: { deletedAt: "desc" },
          select: {
            id: true,
            warrantNumber: true,
            type: true,
            deletedAt: true,
            investigation: { select: { caseNumber: true } },
          },
        })
      : Promise.resolve([]),
    caps.arrest
      ? prisma.arrest.findMany({
          where: deleted,
          orderBy: { deletedAt: "desc" },
          select: {
            id: true,
            deletedAt: true,
            person: { select: { fullName: true } },
            investigation: { select: { caseNumber: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const iso = (d: Date | null) => (d ? d.toISOString() : null);

  const data = {
    investigations: investigations.map((i) => ({ ...i, deletedAt: iso(i.deletedAt) })),
    persons: persons.map((p) => ({ ...p, deletedAt: iso(p.deletedAt) })),
    evidence: evidence.map((e) => ({
      id: e.id,
      evidenceNumber: e.evidenceNumber,
      title: e.title,
      deletedAt: iso(e.deletedAt),
      caseNumber: e.investigation?.caseNumber ?? null,
    })),
    warrants: warrants.map((w) => ({
      id: w.id,
      warrantNumber: w.warrantNumber,
      type: w.type,
      deletedAt: iso(w.deletedAt),
      caseNumber: w.investigation?.caseNumber ?? null,
    })),
    arrests: arrests.map((a) => ({
      id: a.id,
      personName: a.person.fullName,
      deletedAt: iso(a.deletedAt),
      caseNumber: a.investigation?.caseNumber ?? null,
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
