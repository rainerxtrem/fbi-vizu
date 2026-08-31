"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm";

const CATEGORY_LABELS: [string, string][] = [
  ["MOST_WANTED", "Most Wanted"],
  ["FUGITIVE", "Fugitifs"],
  ["ORGANIZED_CRIME", "Crime organisé"],
  ["VIOLENT_CRIME", "Crime violent"],
  ["TERRORISM", "Terrorisme"],
  ["CYBER_CRIME", "Cybercriminalité"],
  ["DRUG_TRAFFICKING", "Trafic de stupéfiants"],
  ["WEAPONS", "Trafic d'armes"],
  ["FINANCIAL_CRIME", "Criminalité financière"],
  ["MISSING_PERSON", "Personnes disparues"],
  ["SEEKING_INFORMATION", "Seeking Information"],
];

const DANGER_LABELS: [string, string][] = [
  ["LOW", "Faible"],
  ["MODERATE", "Modéré"],
  ["HIGH", "Élevé"],
  ["EXTREME", "Extrême"],
];

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
      title: "Créer un bulletin Most Wanted ?",
      message:
        "Un bulletin au statut BROUILLON sera créé à partir du dossier. Il ne sera pas public tant qu'il n'aura pas été révisé et publié.",
      confirmLabel: "Créer le brouillon",
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
    if (!res.ok) return toast("error", json.error ?? "Échec.");
    toast("success", `Brouillon ${json.data.publicId} créé.`);
    router.push(`/agent/most-wanted/${json.data.id}`);
  }

  if (!open) {
    return (
      <Button size="sm" variant="danger" onClick={() => setOpen(true)}>
        Créer un Most Wanted
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-lg border border-navy-200 bg-navy-50 p-4 sm:grid-cols-2">
      <Field label="Sujet (personne)">
        <Select name="personId" defaultValue="">
          <option value="">— nouveau —</option>
          {persons.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Nom complet" required>
        <Input name="fullName" required />
      </Field>
      <Field label="Alias">
        <Input name="aliases" />
      </Field>
      <Field label="Âge">
        <Input name="age" type="number" />
      </Field>
      <Field label="URL de la photo">
        <Input name="photoUrl" placeholder="https://…" />
      </Field>
      <Field label="Récompense (USD)">
        <Input name="reward" type="number" defaultValue={0} />
      </Field>
      <Field label="Catégorie">
        <Select name="category" defaultValue="MOST_WANTED">
          {CATEGORY_LABELS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Niveau de dangerosité">
        <Select name="dangerLevel" defaultValue="HIGH">
          {DANGER_LABELS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Dernière localisation connue" className="sm:col-span-2">
        <Input name="lastKnownLocation" />
      </Field>
      <Field label="Description publique" className="sm:col-span-2">
        <Textarea name="description" rows={3} required />
      </Field>
      <div className="flex gap-2 sm:col-span-2">
        <Button size="sm" type="submit" disabled={busy}>
          {busy ? "Création…" : "Créer le brouillon"}
        </Button>
        <Button size="sm" type="button" variant="secondary" onClick={() => setOpen(false)}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
