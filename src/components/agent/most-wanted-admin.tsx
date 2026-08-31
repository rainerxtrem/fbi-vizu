"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm";
import { MOST_WANTED_STATUS_FLOW } from "@/lib/constants";

const NEXT: Record<string, { to: string; label: string; danger?: boolean }[]> = {
  DRAFT: [{ to: "REVIEW", label: "Soumettre pour révision" }],
  REVIEW: [
    { to: "PUBLISHED", label: "Approuver et publier" },
    { to: "DRAFT", label: "Renvoyer en brouillon" },
  ],
  PUBLISHED: [
    { to: "CAPTURED", label: "Marquer Captured" },
    { to: "LOCATED", label: "Marquer localisé" },
    { to: "ARCHIVED", label: "Archiver", danger: true },
  ],
  CAPTURED: [{ to: "ARCHIVED", label: "Archiver" }],
  LOCATED: [{ to: "ARCHIVED", label: "Archiver" }],
  ARCHIVED: [],
};

async function patch(id: string, body: unknown) {
  const r = await fetch(`/api/most-wanted/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { ok: r.ok, json: await r.json() };
}

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

export function MostWantedWorkflow({
  id,
  status,
  caps,
}: {
  id: string;
  status: string;
  caps: { review: boolean; publish: boolean; edit: boolean; archive: boolean; del: boolean };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);

  const transitions = (NEXT[status] ?? []).filter((t) => {
    if (t.to === "REVIEW") return caps.edit || caps.review;
    if (t.to === "PUBLISHED") return caps.publish;
    if (t.to === "DRAFT") return caps.review || caps.publish;
    if (t.to === "ARCHIVED") return caps.archive;
    return caps.edit || caps.publish;
  });

  async function go(to: string, danger?: boolean) {
    const needsConfirm = to === "PUBLISHED" || danger;
    if (needsConfirm) {
      const ok = await confirm({
        title: to === "PUBLISHED" ? "Publier ce bulletin sur FBI.gov ?" : `Passer le bulletin au statut ${to} ?`,
        message:
          to === "PUBLISHED"
            ? "Il sera immédiatement visible par le public sur la page Most Wanted."
            : "Cela modifie l'état du bulletin dans le flux de validation.",
        confirmLabel: to === "PUBLISHED" ? "Publier" : "Confirmer",
        danger,
      });
      if (!ok) return;
    }
    setBusy(true);
    const { ok, json } = await patch(id, { status: to });
    setBusy(false);
    if (!ok) return toast("error", json.error ?? "Échec de la transition.");
    toast("success", `Bulletin passé au statut ${to}.`);
    router.refresh();
  }

  async function del() {
    const ok = await confirm({
      title: "Supprimer ce bulletin ?",
      message: "Cela supprime définitivement la fiche Most Wanted.",
      confirmLabel: "Supprimer",
      danger: true,
    });
    if (!ok) return;
    const r = await fetch(`/api/most-wanted/${id}`, { method: "DELETE" });
    if (!r.ok) {
      const j = await r.json();
      return toast("error", j.error ?? "Échec de la suppression.");
    }
    toast("success", "Bulletin supprimé.");
    router.push("/agent/most-wanted");
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 text-xs text-navy-500">
        {MOST_WANTED_STATUS_FLOW.map((s, i) => (
          <span key={s} className={s === status ? "font-bold text-navy-900" : ""}>
            {s}
            {i < MOST_WANTED_STATUS_FLOW.length - 1 ? " → " : ""}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {transitions.map((t) => (
          <Button
            key={t.to}
            size="sm"
            variant={t.to === "PUBLISHED" ? "primary" : t.danger ? "danger" : "secondary"}
            disabled={busy}
            onClick={() => go(t.to, t.danger)}
          >
            {t.label}
          </Button>
        ))}
        {caps.del ? (
          <Button size="sm" variant="ghost" onClick={del}>
            Supprimer
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function MostWantedEditor({
  id,
  initial,
}: {
  id: string;
  initial: Record<string, unknown>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const { ok, json } = await patch(id, {
      fullName: fd.get("fullName"),
      aliases: fd.get("aliases"),
      age: fd.get("age") || undefined,
      photoUrl: fd.get("photoUrl"),
      description: fd.get("description"),
      reward: fd.get("reward") || 0,
      category: fd.get("category"),
      dangerLevel: fd.get("dangerLevel"),
      lastKnownLocation: fd.get("lastKnownLocation"),
      vehicle: fd.get("vehicle"),
      associates: fd.get("associates"),
      knownOrganizations: fd.get("knownOrganizations"),
      dateLastSeen: fd.get("dateLastSeen") || undefined,
      charges: String(fd.get("charges") ?? "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    });
    setBusy(false);
    if (!ok) return toast("error", json.error ?? "Échec de l'enregistrement.");
    toast("success", "Bulletin mis à jour.");
    router.refresh();
  }

  const s = (k: string) => (initial[k] == null ? "" : String(initial[k]));

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <Field label="Nom complet" required>
        <Input name="fullName" defaultValue={s("fullName")} required />
      </Field>
      <Field label="Alias">
        <Input name="aliases" defaultValue={s("aliases")} />
      </Field>
      <Field label="Âge">
        <Input name="age" type="number" defaultValue={s("age")} />
      </Field>
      <Field label="Récompense (USD)">
        <Input name="reward" type="number" defaultValue={s("reward")} />
      </Field>
      <Field label="URL de la photo" className="sm:col-span-2">
        <Input name="photoUrl" defaultValue={s("photoUrl")} />
      </Field>
      <Field label="Catégorie">
        <Select name="category" defaultValue={s("category") || "MOST_WANTED"}>
          {CATEGORY_LABELS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Niveau de dangerosité">
        <Select name="dangerLevel" defaultValue={s("dangerLevel") || "MODERATE"}>
          {DANGER_LABELS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Dernière localisation connue">
        <Input name="lastKnownLocation" defaultValue={s("lastKnownLocation")} />
      </Field>
      <Field label="Véhicule">
        <Input name="vehicle" defaultValue={s("vehicle")} />
      </Field>
      <Field label="Date de dernière observation">
        <Input name="dateLastSeen" type="date" defaultValue={s("dateLastSeen")} />
      </Field>
      <Field label="Complices">
        <Input name="associates" defaultValue={s("associates")} />
      </Field>
      <Field label="Organisations connues" className="sm:col-span-2">
        <Input name="knownOrganizations" defaultValue={s("knownOrganizations")} />
      </Field>
      <Field label="Chefs d'accusation (un par ligne)" className="sm:col-span-2">
        <Textarea name="charges" rows={4} defaultValue={s("charges")} />
      </Field>
      <Field label="Description publique" className="sm:col-span-2">
        <Textarea name="description" rows={5} defaultValue={s("description")} required />
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={busy}>
          {busy ? "Enregistrement…" : "Enregistrer le bulletin"}
        </Button>
      </div>
    </form>
  );
}
