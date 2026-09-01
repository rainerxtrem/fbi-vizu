import { notFound } from "next/navigation";
import { requireAgent } from "@/lib/auth";
import { getInvestigationOr404 } from "@/lib/access";
import { RbacError } from "@/lib/rbac";
import { PrintShell, DocGrid, DocField, DocSection } from "@/components/print/print-shell";
import { formatDate, formatDateTime } from "@/lib/format";
import {
  INVESTIGATION_STATUS,
  PRIORITY,
  CLASSIFICATION,
  PERSON_ROLE,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function InvestigationPrint({ params }: { params: { id: string } }) {
  const actor = await requireAgent();
  let inv;
  try {
    inv = await getInvestigationOr404(params.id, actor);
  } catch (e) {
    if (e instanceof RbacError) notFound();
    throw e;
  }

  return (
    <PrintShell title={`Synthèse d'enquête — ${inv.title}`} reference={inv.caseNumber} autoPrint>
      <DocGrid>
        <DocField label="Case Number" value={inv.caseNumber} />
        <DocField label="Statut" value={INVESTIGATION_STATUS[inv.status]?.label ?? inv.status} />
        <DocField label="Priorité" value={PRIORITY[inv.priority]?.label ?? inv.priority} />
        <DocField
          label="Classification"
          value={CLASSIFICATION[inv.classification]?.label ?? inv.classification}
        />
        <DocField label="Field Office" value={inv.fieldOffice?.name} />
        <DocField label="Agent responsable" value={inv.leadAgent?.user.name} />
        <DocField label="Ouverte le" value={formatDate(inv.openedAt)} />
        <DocField label="Clôturée le" value={inv.closedAt ? formatDate(inv.closedAt) : null} />
      </DocGrid>

      <DocSection title="Description">
        <p className="whitespace-pre-line">{inv.description}</p>
      </DocSection>

      <DocSection title="Personnes">
        {inv.persons.length > 0 ? (
          <ul className="list-disc pl-5">
            {inv.persons.map((p) => (
              <li key={p.id}>
                {p.person.fullName} — {PERSON_ROLE[p.role]}
              </li>
            ))}
          </ul>
        ) : (
          <p>—</p>
        )}
      </DocSection>

      <DocSection title="Chefs d'accusation">
        {inv.charges.length > 0 ? (
          <ul className="list-disc pl-5">
            {inv.charges.map((c) => (
              <li key={c.id}>
                {c.charge.title}
                {c.person ? ` — ${c.person.fullName}` : ""}
              </li>
            ))}
          </ul>
        ) : (
          <p>—</p>
        )}
      </DocSection>

      <DocSection title="Preuves">
        {inv.evidence.length > 0 ? (
          <ul className="list-disc pl-5">
            {inv.evidence.map((e) => (
              <li key={e.id}>
                #{e.evidenceNumber} — {e.title} ({formatDate(e.collectedAt)})
              </li>
            ))}
          </ul>
        ) : (
          <p>—</p>
        )}
      </DocSection>

      <DocSection title="Mandats">
        {inv.warrants.length > 0 ? (
          <ul className="list-disc pl-5">
            {inv.warrants.map((w) => (
              <li key={w.id}>
                {w.warrantNumber} — {w.type} — {w.status}
                {w.person ? ` — ${w.person.fullName}` : ""}
              </li>
            ))}
          </ul>
        ) : (
          <p>—</p>
        )}
      </DocSection>

      <DocSection title="Arrestations">
        {inv.arrests.length > 0 ? (
          <ul className="list-disc pl-5">
            {inv.arrests.map((a) => (
              <li key={a.id}>
                {a.person.fullName} — {formatDate(a.arrestDate)}
                {a.arrestingAgent ? ` — ${a.arrestingAgent.user.name}` : ""}
              </li>
            ))}
          </ul>
        ) : (
          <p>—</p>
        )}
      </DocSection>

      <DocSection title="Chronologie">
        <ul className="space-y-1">
          {inv.timeline.slice(0, 40).map((t) => (
            <li key={t.id} className="text-xs">
              <span className="text-navy-400">{formatDateTime(t.occurredAt)}</span> — {t.message}
            </li>
          ))}
        </ul>
      </DocSection>
    </PrintShell>
  );
}
