"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { RANK_LABELS, RANK_ORDER, type Rank } from "@/lib/rbac";

export function AgentCreateForm({
  offices,
  maxLevel,
  canGrantAdmin,
  prefill,
}: {
  offices: { id: string; label: string }[];
  maxLevel: number; // -1 = no ceiling (Director)
  canGrantAdmin: boolean;
  prefill?: { name?: string; email?: string; applicationId?: string; title?: string };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{
    agentId: string;
    badgeNumber: string;
    email: string;
    tempPassword?: string;
  } | null>(null);

  const ranks = RANK_ORDER.filter((_, i) => maxLevel === -1 || i < maxLevel);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const r = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        email: fd.get("email"),
        password: fd.get("password") || undefined,
        badgeNumber: fd.get("badgeNumber") || undefined,
        rank: fd.get("rank"),
        title: fd.get("title"),
        division: fd.get("division"),
        unit: fd.get("unit") || undefined,
        fieldOfficeId: fd.get("fieldOfficeId") || undefined,
        phone: fd.get("phone") || undefined,
        isAdmin: fd.get("isAdmin") === "on",
        applicationId: prefill?.applicationId,
      }),
    });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) return toast("error", j.error ?? "Échec du recrutement.");
    toast("success", "Agent recruté.");
    setDone(j.data);
  }

  if (done) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm">
          <p className="font-semibold text-emerald-900">Agent créé — matricule {done.badgeNumber}</p>
          <p className="mt-1 text-emerald-800">Identifiant : {done.email}</p>
          {done.tempPassword ? (
            <p className="mt-2 text-emerald-800">
              Mot de passe temporaire :{" "}
              <code className="rounded bg-white px-1.5 py-0.5 font-mono text-navy-900">
                {done.tempPassword}
              </code>
              <br />
              <span className="text-xs">
                Communiquez-le à l&apos;agent ; il ne sera plus affiché. L&apos;agent devrait le
                changer à la première connexion (Paramètres &gt; Sécurité).
              </span>
            </p>
          ) : (
            <p className="mt-2 text-emerald-800">
              Le mot de passe défini a été enregistré.
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <Link href={`/agent/agents/${done.agentId}`}>
            <Button size="sm">Ouvrir la fiche de l&apos;agent</Button>
          </Link>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setDone(null);
              router.refresh();
            }}
          >
            Recruter un autre agent
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <Field label="Nom complet" required>
        <Input name="name" required defaultValue={prefill?.name ?? ""} minLength={2} />
      </Field>
      <Field label="E-mail (identifiant de connexion)" required>
        <Input name="email" type="email" required defaultValue={prefill?.email ?? ""} />
      </Field>
      <Field label="Grade">
        <Select name="rank" defaultValue={ranks.includes("NAT") ? "NAT" : ranks[0]}>
          {ranks.map((r) => (
            <option key={r} value={r}>
              {RANK_LABELS[r as Rank]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Matricule" hint="Laisser vide pour attribuer automatiquement">
        <Input name="badgeNumber" placeholder="FBI-0042" />
      </Field>
      <Field label="Fonction" required>
        <Input name="title" required defaultValue={prefill?.title ?? "Special Agent"} />
      </Field>
      <Field label="Division" required>
        <Input name="division" required defaultValue="Division de San Andreas" />
      </Field>
      <Field label="Unité">
        <Input name="unit" />
      </Field>
      <Field label="Field Office">
        <Select name="fieldOfficeId" defaultValue="">
          <option value="">— Quartier général —</option>
          {offices.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Téléphone">
        <Input name="phone" />
      </Field>
      <Field label="Mot de passe temporaire" hint="Laisser vide pour en générer un">
        <Input name="password" type="text" minLength={10} autoComplete="off" />
      </Field>
      {canGrantAdmin ? (
        <label className="flex items-center gap-2 text-sm text-navy-700 sm:col-span-2">
          <input type="checkbox" name="isAdmin" className="h-4 w-4" />
          Accorder le rôle « administrateur de la plateforme »
        </label>
      ) : null}
      <div className="sm:col-span-2">
        <Button type="submit" size="sm" disabled={busy}>
          {busy ? "Création…" : "Recruter l'agent"}
        </Button>
      </div>
    </form>
  );
}
