import { notFound } from "next/navigation";
import { requireAgent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getInvestigationOr404 } from "@/lib/access";
import { RbacError } from "@/lib/rbac";
import { PrintShell, DocGrid, DocField, DocSection } from "@/components/print/print-shell";
import { formatDate } from "@/lib/format";
import { WARRANT_STATUS, WARRANT_TYPE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function WarrantPrint({ params }: { params: { id: string } }) {
  const actor = await requireAgent();
  const w = await prisma.warrant.findUnique({
    where: { id: params.id },
    include: {
      person: true,
      requestedBy: { include: { user: true } },
      approvedBy: { include: { user: true } },
    },
  });
  if (!w) notFound();

  let inv;
  try {
    inv = await getInvestigationOr404(w.investigationId, actor);
  } catch (e) {
    if (e instanceof RbacError) notFound();
    throw e;
  }

  return (
    <PrintShell title={`Mandat de ${WARRANT_TYPE[w.type]?.toLowerCase() ?? w.type}`} reference={w.warrantNumber} autoPrint>
      <DocGrid>
        <DocField label="Numéro de mandat" value={w.warrantNumber} />
        <DocField label="Type" value={WARRANT_TYPE[w.type] ?? w.type} />
        <DocField label="Statut" value={WARRANT_STATUS[w.status]?.label ?? w.status} />
        <DocField label="Dossier" value={`${inv.caseNumber} — ${inv.title}`} />
        <DocField label="Personne visée" value={w.person?.fullName} />
        <DocField label="Alias" value={w.person?.alias} />
        <DocField label="Juge émetteur" value={w.issuingJudge} />
        <DocField label="Émis le" value={w.issuedDate ? formatDate(w.issuedDate) : null} />
        <DocField label="Expire le" value={w.expiryDate ? formatDate(w.expiryDate) : null} />
        <DocField label="Demandé par" value={w.requestedBy?.user.name} />
        <DocField label="Approuvé par" value={w.approvedBy?.user.name} />
      </DocGrid>

      <DocSection title="Exposé des motifs">
        <p className="whitespace-pre-line">{w.description || "—"}</p>
      </DocSection>

      {w.deniedReason ? (
        <DocSection title="Motif de refus">
          <p className="whitespace-pre-line">{w.deniedReason}</p>
        </DocSection>
      ) : null}

      <DocSection title="Signatures">
        <div className="mt-8 grid grid-cols-2 gap-10">
          <div className="border-t border-navy-400 pt-1 text-xs text-navy-500">
            Agent demandeur — {w.requestedBy?.user.name ?? "________________"}
          </div>
          <div className="border-t border-navy-400 pt-1 text-xs text-navy-500">
            Autorité d&apos;approbation — {w.approvedBy?.user.name ?? "________________"}
          </div>
        </div>
      </DocSection>
    </PrintShell>
  );
}
