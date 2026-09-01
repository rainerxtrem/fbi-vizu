import { notFound } from "next/navigation";
import { requireAgent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getInvestigationOr404 } from "@/lib/access";
import { RbacError } from "@/lib/rbac";
import { PrintShell, DocGrid, DocField, DocSection } from "@/components/print/print-shell";
import { formatDate, ageFromDob } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ArrestPrint({ params }: { params: { id: string } }) {
  const actor = await requireAgent();
  const a = await prisma.arrest.findUnique({
    where: { id: params.id },
    include: {
      person: true,
      arrestingAgent: { include: { user: true } },
      chargeLinks: { include: { charge: true } },
    },
  });
  if (!a) notFound();

  let inv;
  try {
    inv = await getInvestigationOr404(a.investigationId, actor);
  } catch (e) {
    if (e instanceof RbacError) notFound();
    throw e;
  }

  return (
    <PrintShell title="Rapport d'arrestation" reference={inv.caseNumber} autoPrint>
      <DocGrid>
        <DocField label="Personne interpellée" value={a.person.fullName} />
        <DocField label="Alias" value={a.person.alias} />
        <DocField label="Âge" value={ageFromDob(a.person.dob)?.toString()} />
        <DocField label="Date d'arrestation" value={formatDate(a.arrestDate)} />
        <DocField label="Lieu" value={a.location} />
        <DocField label="Agent interpellateur" value={a.arrestingAgent?.user.name} />
        <DocField label="Dossier" value={`${inv.caseNumber} — ${inv.title}`} />
      </DocGrid>

      <DocSection title="Chefs d'accusation">
        {a.chargeLinks.length > 0 ? (
          <ul className="list-disc pl-5">
            {a.chargeLinks.map((cl) => (
              <li key={cl.id}>
                {cl.charge.title}
                <span className="text-navy-400"> — {cl.charge.severity}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>{a.charges || "—"}</p>
        )}
        {a.chargeLinks.length > 0 && a.charges ? (
          <p className="mt-2 text-navy-600">{a.charges}</p>
        ) : null}
      </DocSection>

      <DocSection title="Observations">
        <p className="whitespace-pre-line">{a.notes || "—"}</p>
      </DocSection>

      <DocSection title="Signature">
        <div className="mt-8 w-1/2 border-t border-navy-400 pt-1 text-xs text-navy-500">
          Agent interpellateur — {a.arrestingAgent?.user.name ?? "________________"}
        </div>
      </DocSection>
    </PrintShell>
  );
}
