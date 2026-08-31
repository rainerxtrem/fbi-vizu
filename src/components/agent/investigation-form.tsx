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
      toast("error", json.error ?? "Could not create the investigation.");
      return;
    }
    toast("success", `Case ${json.data.caseNumber} created.`);
    router.push(`/agent/investigations/${json.data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <Section title="General Information">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Case Title" required error={errors.title} className="sm:col-span-2">
            <Input name="title" required />
          </Field>
          <Field label="Case Number" hint="Leave blank to auto-generate (FIA-YYYY-#####)">
            <Input name="caseNumber" placeholder="Auto" />
          </Field>
          <Field label="Classification">
            <Select name="classification" defaultValue="UNCLASSIFIED">
              <option value="UNCLASSIFIED">Unclassified</option>
              <option value="RESTRICTED">Restricted</option>
              <option value="CONFIDENTIAL">Confidential</option>
              <option value="SECRET">Secret</option>
            </Select>
          </Field>
          <Field label="Priority">
            <Select name="priority" defaultValue="MEDIUM">
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </Select>
          </Field>
          <Field label="Status">
            <Select name="status" defaultValue="OPEN">
              <option value="OPEN">Open</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </Select>
          </Field>
          <Field label="Description" required error={errors.description} className="sm:col-span-2">
            <Textarea name="description" rows={5} required />
          </Field>
        </div>
      </Section>

      <Section title="Assignment">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Lead Agent" hint="Defaults to you">
            <Select name="leadAgentId" defaultValue="">
              <option value="">— You —</option>
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
          <Field label="Unit">
            <Input name="unit" />
          </Field>
          <Field label="Task Force" className="sm:col-span-2">
            <Input name="taskForce" />
          </Field>
          <div className="sm:col-span-2">
            <p className="field-label">Assigned Agents</p>
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
          <Field label="Jurisdiction">
            <Input name="jurisdiction" placeholder="e.g. Los Santos County" />
          </Field>
          <Field label="Location" className="sm:col-span-2">
            <Input name="incidentLocation" />
          </Field>
        </div>
      </Section>

      <Section title="Involved Persons">
        <p className="mb-3 text-xs text-navy-500">
          Enter one name per line. Person records are created automatically and become searchable.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Suspects">
            <Textarea name="suspects" rows={3} />
          </Field>
          <Field label="Victims">
            <Textarea name="victims" rows={3} />
          </Field>
          <Field label="Witnesses">
            <Textarea name="witnesses" rows={3} />
          </Field>
        </div>
      </Section>

      <Section title="Crimes">
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
        <Textarea name="notes" rows={4} placeholder="Initial case notes…" />
      </Section>

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Creating…" : "Create Case"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
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
