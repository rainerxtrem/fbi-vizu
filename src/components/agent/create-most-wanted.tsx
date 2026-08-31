"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm";

export function CreateMostWanted({
  investigationId,
  defaults,
  persons,
}: {
  investigationId: string;
  defaults: { charges: string[]; leadAgent: string | null; caseNumber: string };
  persons: { id: string; label: string }[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const ok = await confirm({
      title: "Create Most Wanted bulletin?",
      message:
        "This creates a DRAFT bulletin pre-filled from the case. It will not be public until reviewed and published.",
      confirmLabel: "Create Draft",
    });
    if (!ok) return;
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/most-wanted", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        investigationId,
        personId: fd.get("personId") || undefined,
        fullName: fd.get("fullName"),
        aliases: fd.get("aliases"),
        age: fd.get("age") || undefined,
        photoUrl: fd.get("photoUrl"),
        description: fd.get("description"),
        charges: defaults.charges,
        reward: fd.get("reward") || 0,
        category: fd.get("category"),
        dangerLevel: fd.get("dangerLevel"),
        lastKnownLocation: fd.get("lastKnownLocation"),
        leadAgent: defaults.leadAgent ?? undefined,
        caseNumber: defaults.caseNumber,
      }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) return toast("error", json.error ?? "Failed.");
    toast("success", `Draft ${json.data.publicId} created.`);
    router.push(`/agent/most-wanted/${json.data.id}`);
  }

  if (!open) {
    return (
      <Button size="sm" variant="danger" onClick={() => setOpen(true)}>
        Create Most Wanted
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-lg border border-navy-200 bg-navy-50 p-4 sm:grid-cols-2">
      <Field label="Subject (person)">
        <Select name="personId" defaultValue="">
          <option value="">— new —</option>
          {persons.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Full Name" required>
        <Input name="fullName" required />
      </Field>
      <Field label="Aliases">
        <Input name="aliases" />
      </Field>
      <Field label="Age">
        <Input name="age" type="number" />
      </Field>
      <Field label="Photo URL">
        <Input name="photoUrl" placeholder="https://…" />
      </Field>
      <Field label="Reward (USD)">
        <Input name="reward" type="number" defaultValue={0} />
      </Field>
      <Field label="Category">
        <Select name="category" defaultValue="MOST_WANTED">
          {["MOST_WANTED", "FUGITIVE", "ORGANIZED_CRIME", "VIOLENT_CRIME", "TERRORISM", "CYBER_CRIME", "DRUG_TRAFFICKING", "WEAPONS", "FINANCIAL_CRIME", "MISSING_PERSON", "SEEKING_INFORMATION"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
      </Field>
      <Field label="Danger Level">
        <Select name="dangerLevel" defaultValue="HIGH">
          {["LOW", "MODERATE", "HIGH", "EXTREME"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
      </Field>
      <Field label="Last Known Location" className="sm:col-span-2">
        <Input name="lastKnownLocation" />
      </Field>
      <Field label="Public Description" className="sm:col-span-2">
        <Textarea name="description" rows={3} required />
      </Field>
      <div className="flex gap-2 sm:col-span-2">
        <Button size="sm" type="submit" disabled={busy}>
          {busy ? "Creating…" : "Create Draft"}
        </Button>
        <Button size="sm" type="button" variant="secondary" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
