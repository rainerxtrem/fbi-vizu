"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, Input, Textarea, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { FEDERAL_CRIMES } from "@/lib/constants";

interface Option {
  id: string;
  label: string;
}

export function InvestigationForm({
  agents,
  offices,
}: {
  agents: Option[];
  offices: Option[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [charges, setCharges] = useState<string[]>([]);
  const [assigned, setAssigned] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function toggle(list: string[], set: (v: string[]) => void, value: string) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    const fd = new FormData(e.currentTarget);

    const payload = {
      title: fd.get("title"),
      caseNumber: fd.get("caseNumber") || undefined,
      classification: fd.get("classification"),
      priority: fd.get("priority"),
      status: fd.get("status"),
      description: fd.get("description"),
      leadAgentId: fd.get("leadAgentId") || undefined,
      assignedAgentIds: assigned,
      fieldOfficeId: fd.get("fieldOfficeId") || undefined,
      division: fd.get("division") || undefined,
      unit: fd.get("unit") || undefined,
      taskForce: fd.get("taskForce") || undefined,
      incidentDate: fd.get("incidentDate") || undefined,
      incidentLocation: fd.get("incidentLocation") || undefined,
      jurisdiction: fd.get("jurisdiction") || undefined,
      charges,
      suspects: splitList(fd.get("suspects")),
      victims: splitList(fd.get("victims")),
      witnesses: splitList(fd.get("witnesses")),
      notes: fd.get("notes") || undefined,
    };

    const res = await fetch("/api/investigations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      if (json.issues?.fieldErrors) {
        const fe: Record<string, string> = {};
        for (const [k, v] of Object.entries(json.issues.fieldErrors)) fe[k] = (v as string[])[0];
        setErrors(fe);
      }
      toast("error", json.error ?? "Impossible de créer l'enquête.");
      return;
    }
    toast("success", `Dossier ${json.data.caseNumber} créé.`);
    router.push(`/agent/investigations/${json.data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <Section title="Informations générales">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Titre du dossier" required error={errors.title} className="sm:col-span-2">
            <Input name="title" required />
          </Field>
          <Field label="Case Number" hint="Laissez vide pour générer automatiquement (FBI-AAAA-#####)">
            <Input name="caseNumber" placeholder="Automatique" />
          </Field>
          <Field label="Classification">
            <Select name="classification" defaultValue="UNCLASSIFIED">
              <option value="UNCLASSIFIED">Non classifié</option>
              <option value="RESTRICTED">Restreint</option>
              <option value="CONFIDENTIAL">Confidentiel</option>
              <option value="SECRET">Secret</option>
            </Select>
          </Field>
          <Field label="Priorité">
            <Select name="priority" defaultValue="MEDIUM">
              <option value="LOW">Faible</option>
              <option value="MEDIUM">Moyenne</option>
              <option value="HIGH">Élevée</option>
              <option value="CRITICAL">Critique</option>
            </Select>
          </Field>
          <Field label="Statut">
            <Select name="status" defaultValue="OPEN">
              <option value="OPEN">Ouverte</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspendue</option>
            </Select>
          </Field>
          <Field label="Description" required error={errors.description} className="sm:col-span-2">
            <Textarea name="description" rows={5} required />
          </Field>
        </div>
      </Section>

      <Section title="Affectation">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Agent responsable" hint="Vous par défaut">
            <Select name="leadAgentId" defaultValue="">
              <option value="">— Vous —</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Field Office">
            <Select name="fieldOfficeId" defaultValue="">
              <option value="">—</option>
              {offices.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Division">
            <Input name="division" />
          </Field>
          <Field label="Unité">
            <Input name="unit" />
          </Field>
          <Field label="Groupe d'intervention" className="sm:col-span-2">
            <Input name="taskForce" />
          </Field>
          <div className="sm:col-span-2">
            <p className="field-label">Agents affectés</p>
            <div className="flex flex-wrap gap-2 rounded-md border border-navy-200 p-2">
              {agents.map((a) => (
                <button
                  type="button"
                  key={a.id}
                  onClick={() => toggle(assigned, setAssigned, a.id)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    assigned.includes(a.id)
                      ? "border-navy-800 bg-navy-800 text-white"
                      : "border-navy-200 text-navy-600"
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Incident">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date">
            <Input name="incidentDate" type="date" />
          </Field>
          <Field label="Juridiction">
            <Input name="jurisdiction" placeholder="ex. comté de Los Santos" />
          </Field>
          <Field label="Lieu" className="sm:col-span-2">
            <Input name="incidentLocation" />
          </Field>
        </div>
      </Section>

      <Section title="Personnes impliquées">
        <p className="mb-3 text-xs text-navy-500">
          Saisissez un nom par ligne. Les fiches de personnes sont créées automatiquement et deviennent consultables.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Suspects">
            <Textarea name="suspects" rows={3} />
          </Field>
          <Field label="Victimes">
            <Textarea name="victims" rows={3} />
          </Field>
          <Field label="Témoins">
            <Textarea name="witnesses" rows={3} />
          </Field>
        </div>
      </Section>

      <Section title="Infractions">
        <div className="flex flex-wrap gap-2">
          {FEDERAL_CRIMES.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => toggle(charges, setCharges, c)}
              className={`rounded-full border px-3 py-1 text-xs ${
                charges.includes(c)
                  ? "border-navy-800 bg-navy-800 text-white"
                  : "border-navy-200 text-navy-600 hover:bg-navy-50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Notes">
        <Textarea name="notes" rows={4} placeholder="Notes initiales du dossier…" />
      </Section>

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Création…" : "Créer le dossier"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Annuler
        </Button>
      </div>
    </form>
  );
}

function splitList(v: FormDataEntryValue | null): string[] {
  return String(v ?? "")
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-navy-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-navy-700">{title}</h2>
      {children}
    </section>
  );
}
