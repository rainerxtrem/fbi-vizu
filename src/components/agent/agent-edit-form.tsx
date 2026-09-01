"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function AgentEditForm({
  agentId,
  offices,
  initial,
}: {
  agentId: string;
  offices: { id: string; label: string }[];
  initial: {
    title: string;
    division: string;
    unit: string | null;
    status: string;
    fieldOfficeId: string | null;
    phone: string | null;
  };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/agents/${agentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: fd.get("title"),
        division: fd.get("division"),
        unit: fd.get("unit"),
        status: fd.get("status"),
        fieldOfficeId: fd.get("fieldOfficeId"),
        phone: fd.get("phone"),
      }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) return toast("error", json.error ?? "Échec de l'enregistrement.");
    toast("success", "Agent mis à jour.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <Field label="Fonction">
        <Input name="title" defaultValue={initial.title} />
      </Field>
      <Field label="Statut">
        <Select name="status" defaultValue={initial.status}>
          {[
            ["ACTIVE", "Actif"],
            ["ON_LEAVE", "En congé"],
            ["SUSPENDED", "Suspendu"],
            ["INACTIVE", "Inactif"],
          ].map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Division">
        <Input name="division" defaultValue={initial.division} />
      </Field>
      <Field label="Unité">
        <Input name="unit" defaultValue={initial.unit ?? ""} />
      </Field>
      <Field label="Field Office">
        <Select name="fieldOfficeId" defaultValue={initial.fieldOfficeId ?? ""}>
          <option value="">— Quartier général —</option>
          {offices.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Téléphone">
        <Input name="phone" defaultValue={initial.phone ?? ""} />
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" size="sm" disabled={busy}>
          {busy ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
