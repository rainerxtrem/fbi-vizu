"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

type Values = Record<string, string | null | undefined>;

export function SuspectForm({
  mode,
  id,
  initial,
}: {
  mode: "create" | "edit";
  id?: string;
  initial?: Values;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const v = initial ?? {};

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(
      ["fullName", "alias", "dob", "gender", "photoUrl", "description", "knownAddresses", "riskLevel", "criminalHistory", "notes"].map(
        (k) => [k, fd.get(k) || undefined],
      ),
    );
    const res = await fetch(
      mode === "create" ? "/api/suspects" : `/api/suspects/${id}`,
      {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      if (json.issues?.fieldErrors) {
        const fe: Record<string, string> = {};
        for (const [k, val] of Object.entries(json.issues.fieldErrors)) fe[k] = (val as string[])[0];
        setErrors(fe);
      }
      toast("error", json.error ?? "Échec de l'enregistrement.");
      return;
    }
    toast("success", mode === "create" ? "Fiche de personne créée." : "Fiche mise à jour.");
    router.push(`/agent/suspects/${json.data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <Field label="Nom complet" required error={errors.fullName}>
        <Input name="fullName" defaultValue={v.fullName ?? ""} required />
      </Field>
      <Field label="Alias">
        <Input name="alias" defaultValue={v.alias ?? ""} />
      </Field>
      <Field label="Date de naissance">
        <Input name="dob" type="date" defaultValue={v.dob ?? ""} />
      </Field>
      <Field label="Genre">
        <Input name="gender" defaultValue={v.gender ?? ""} />
      </Field>
      <Field label="URL de la photographie" className="sm:col-span-2">
        <Input name="photoUrl" defaultValue={v.photoUrl ?? ""} placeholder="https://…" />
      </Field>
      <Field label="Niveau de risque">
        <Select name="riskLevel" defaultValue={v.riskLevel ?? "LOW"}>
          {[
            ["LOW", "Faible"],
            ["MEDIUM", "Moyen"],
            ["HIGH", "Élevé"],
            ["EXTREME", "Extrême"],
          ].map(([val, l]) => (
            <option key={val} value={val}>
              {l}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Adresses connues">
        <Input name="knownAddresses" defaultValue={v.knownAddresses ?? ""} />
      </Field>
      <Field label="Description" className="sm:col-span-2">
        <Textarea name="description" rows={3} defaultValue={v.description ?? ""} />
      </Field>
      <Field label="Antécédents judiciaires" className="sm:col-span-2">
        <Textarea name="criminalHistory" rows={3} defaultValue={v.criminalHistory ?? ""} />
      </Field>
      <Field label="Notes" className="sm:col-span-2">
        <Textarea name="notes" rows={3} defaultValue={v.notes ?? ""} />
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={busy}>
          {busy ? "Enregistrement…" : mode === "create" ? "Créer la fiche" : "Enregistrer les modifications"}
        </Button>
      </div>
    </form>
  );
}
