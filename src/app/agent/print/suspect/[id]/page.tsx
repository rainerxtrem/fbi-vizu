import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PrintShell, DocGrid, DocField, DocSection } from "@/components/print/print-shell";
import { formatDate, ageFromDob } from "@/lib/format";
import { RISK_LEVEL, PERSON_ROLE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function SuspectPrint({ params }: { params: { id: string } }) {
  await requirePermission("suspect.view");
  const p = await prisma.person.findFirst({
    where: { id: params.id, deletedAt: null },
    include: {
      investigations: { include: { investigation: true } },
      arrests: { include: { investigation: true }, orderBy: { arrestDate: "desc" } },
      warrants: true,
    },
  });
  if (!p) notFound();

  return (
    <PrintShell title="Fiche de personne" reference={`PER-${p.id.slice(-6).toUpperCase()}`} autoPrint>
      <DocGrid>
        <DocField label="Nom complet" value={p.fullName} />
        <DocField label="Alias" value={p.alias} />
        <DocField label="Date de naissance" value={p.dob ? formatDate(p.dob) : null} />
        <DocField label="Âge" value={ageFromDob(p.dob)?.toString()} />
        <DocField label="Genre" value={p.gender} />
        <DocField label="Niveau de risque" value={RISK_LEVEL[p.riskLevel]?.label ?? p.riskLevel} />
        <DocField label="Adresses connues" value={p.knownAddresses} />
        <DocField label="Fiche créée le" value={formatDate(p.createdAt)} />
      </DocGrid>

      <DocSection title="Signalement">
        <p className="whitespace-pre-line">{p.description || "—"}</p>
      </DocSection>

      <DocSection title="Antécédents judiciaires">
        <p className="whitespace-pre-line">{p.criminalHistory || "—"}</p>
      </DocSection>

      <DocSection title="Dossiers associés">
        {p.investigations.length > 0 ? (
          <ul className="list-disc pl-5">
            {p.investigations.map((ip) => (
              <li key={ip.id}>
                {ip.investigation.caseNumber} — {ip.investigation.title} ({PERSON_ROLE[ip.role]})
              </li>
            ))}
          </ul>
        ) : (
          <p>—</p>
        )}
      </DocSection>

      <DocSection title="Arrestations">
        {p.arrests.length > 0 ? (
          <ul className="list-disc pl-5">
            {p.arrests.map((a) => (
              <li key={a.id}>
                {formatDate(a.arrestDate)} — {a.investigation.caseNumber}
                {a.charges ? ` — ${a.charges}` : ""}
              </li>
            ))}
          </ul>
        ) : (
          <p>—</p>
        )}
      </DocSection>

      <DocSection title="Notes">
        <p className="whitespace-pre-line">{p.notes || "—"}</p>
      </DocSection>
    </PrintShell>
  );
}
