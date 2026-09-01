"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm";
import { PRIORITY, CLASSIFICATION } from "@/lib/constants";
import { labelOptions } from "@/lib/i18n";

type Opt = { id: string; label: string };

async function req(url: string, method: string, body?: unknown) {
  const r = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { ok: r.ok, json: await r.json().catch(() => ({})) };
}

// ---------------------------------------------------------------------------
// Édition des champs du dossier
// ---------------------------------------------------------------------------

export function InvestigationEditForm({
  investigationId,
  initial,
  offices,
}: {
  investigationId: string;
  initial: {
    title: string;
    description: string;
    priority: string;
    classification: string;
    division: string | null;
    unit: string | null;
    taskForce: string | null;
    jurisdiction: string | null;
    incidentDate: string | null;
    incidentLocation: string | null;
    fieldOfficeId: string | null;
  };
  offices: Opt[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const { ok, json } = await req(`/api/investigations/${investigationId}`, "PATCH", {
      title: fd.get("title"),
      description: fd.get("description"),
      priority: fd.get("priority"),
      classification: fd.get("classification"),
      division: fd.get("division") || undefined,
      unit: fd.get("unit") || undefined,
      taskForce: fd.get("taskForce") || undefined,
      jurisdiction: fd.get("jurisdiction") || undefined,
      incidentDate: fd.get("incidentDate") || undefined,
      incidentLocation: fd.get("incidentLocation") || undefined,
      fieldOfficeId: fd.get("fieldOfficeId") || undefined,
    });
    setBusy(false);
    if (!ok) return toast("error", json.error ?? "Échec de l'enregistrement.");
    toast("success", "Dossier mis à jour.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <Field label="Titre" className="sm:col-span-2" required>
        <Input name="title" defaultValue={initial.title} required minLength={3} />
      </Field>
      <Field label="Description" className="sm:col-span-2" required>
        <Textarea name="description" rows={5} defaultValue={initial.description} required />
      </Field>
      <Field label="Priorité">
        <Select name="priority" defaultValue={initial.priority}>
          {labelOptions(PRIORITY).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Classification">
        <Select name="classification" defaultValue={initial.classification}>
          {labelOptions(CLASSIFICATION).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </Select>
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
      <Field label="Division">
        <Input name="division" defaultValue={initial.division ?? ""} />
      </Field>
      <Field label="Unité">
        <Input name="unit" defaultValue={initial.unit ?? ""} />
      </Field>
      <Field label="Groupe d'intervention">
        <Input name="taskForce" defaultValue={initial.taskForce ?? ""} />
      </Field>
      <Field label="Juridiction">
        <Input name="jurisdiction" defaultValue={initial.jurisdiction ?? ""} />
      </Field>
      <Field label="Date de l'incident">
        <Input name="incidentDate" type="date" defaultValue={initial.incidentDate ?? ""} />
      </Field>
      <Field label="Lieu de l'incident">
        <Input name="incidentLocation" defaultValue={initial.incidentLocation ?? ""} />
      </Field>
      <div className="sm:col-span-2">
        <Button size="sm" type="submit" disabled={busy}>
          {busy ? "Enregistrement…" : "Enregistrer les modifications"}
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Documents du dossier
// ---------------------------------------------------------------------------

export function InvestigationDocuments({
  investigationId,
  documents,
  canDownload,
  caps,
}: {
  investigationId: string;
  documents: {
    id: string;
    title: string;
    category: string;
    description: string | null;
    uploadedBy: string | null;
    createdAt: string;
    fileUrl: string | null;
    fileName: string | null;
  }[];
  canDownload: boolean;
  caps: { create: boolean; del: boolean };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    let fileUrl: string | undefined;
    const file = fd.get("file") as File | null;
    if (file && file.size > 0) {
      const up = new FormData();
      up.append("file", file);
      const r = await fetch("/api/uploads", { method: "POST", body: up });
      const j = await r.json();
      if (!j.ok) {
        setBusy(false);
        return toast("error", j.error ?? "Échec du téléversement.");
      }
      fileUrl = j.data.url;
    }
    const { ok, json } = await req("/api/documents", "POST", {
      investigationId,
      title: fd.get("title"),
      category: fd.get("category") || undefined,
      description: fd.get("description") || undefined,
      fileUrl,
    });
    setBusy(false);
    if (!ok) return toast("error", json.error ?? "Échec.");
    (e.target as HTMLFormElement).reset();
    toast("success", "Document ajouté.");
    router.refresh();
  }

  async function del(id: string, title: string) {
    const ok = await confirm({
      title: `Supprimer « ${title} » ?`,
      message: "Cette action est définitive.",
      confirmLabel: "Supprimer",
      danger: true,
    });
    if (!ok) return;
    const { ok: done, json } = await req(`/api/documents/${id}`, "DELETE");
    if (!done) return toast("error", json.error ?? "Échec.");
    toast("success", "Document supprimé.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {documents.length === 0 ? (
        <p className="text-sm text-navy-500">Aucun document.</p>
      ) : (
        <div className="divide-y divide-navy-100 rounded-lg border border-navy-200 bg-white">
          {documents.map((d) => (
            <div key={d.id} className="flex items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="font-medium text-navy-900">{d.title}</p>
                <p className="text-xs text-navy-500">
                  {d.category}
                  {d.uploadedBy ? ` · ${d.uploadedBy}` : ""}
                </p>
                {d.description ? (
                  <p className="mt-1 text-sm text-navy-600">{d.description}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {d.fileUrl && canDownload ? (
                  <a
                    href={d.fileUrl}
                    target="_blank"
                    className="text-xs font-semibold uppercase text-navy-600 hover:underline"
                  >
                    Ouvrir
                  </a>
                ) : null}
                {caps.del ? (
                  <button
                    onClick={() => del(d.id, d.title)}
                    className="text-xs font-semibold uppercase text-federal-accent hover:underline"
                  >
                    Supprimer
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {caps.create ? (
        <form onSubmit={add} className="grid gap-3 rounded-lg border border-navy-200 bg-navy-50 p-4 sm:grid-cols-2">
          <Field label="Titre" required>
            <Input name="title" required />
          </Field>
          <Field label="Catégorie">
            <Input name="category" placeholder="Général" />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <Textarea name="description" rows={2} />
          </Field>
          <Field label="Fichier" className="sm:col-span-2">
            <input
              type="file"
              name="file"
              className="block w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-navy-800 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:uppercase file:text-white"
            />
          </Field>
          <div className="sm:col-span-2">
            <Button size="sm" type="submit" disabled={busy}>
              {busy ? "Ajout…" : "Ajouter le document"}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Agents affectés
// ---------------------------------------------------------------------------

export function InvestigationAgents({
  investigationId,
  lead,
  assigned,
  agents,
  canAssign,
  canSetLead,
}: {
  investigationId: string;
  lead: { id: string; name: string } | null;
  assigned: { id: string; name: string; role: string }[];
  agents: Opt[];
  canAssign: boolean;
  canSetLead: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (!fd.get("agentId")) return;
    setBusy(true);
    const { ok, json } = await req(`/api/investigations/${investigationId}/agents`, "POST", {
      agentId: fd.get("agentId"),
      role: fd.get("role") || undefined,
    });
    setBusy(false);
    if (!ok) return toast("error", json.error ?? "Échec.");
    (e.target as HTMLFormElement).reset();
    toast("success", "Agent affecté.");
    router.refresh();
  }

  async function remove(agentId: string, name: string) {
    const ok = await confirm({
      title: `Retirer ${name} du dossier ?`,
      message: "L'agent perd l'accès au dossier (sauf s'il y a accès par ailleurs).",
      confirmLabel: "Retirer",
      danger: true,
    });
    if (!ok) return;
    const { ok: done, json } = await req(
      `/api/investigations/${investigationId}/agents`,
      "DELETE",
      { agentId },
    );
    if (!done) return toast("error", json.error ?? "Échec.");
    toast("success", "Agent retiré.");
    router.refresh();
  }

  async function setLead(agentId: string) {
    const { ok, json } = await req(`/api/investigations/${investigationId}`, "PATCH", {
      leadAgentId: agentId,
    });
    if (!ok) return toast("error", json.error ?? "Échec.");
    toast("success", "Agent responsable mis à jour.");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-navy-200 bg-white">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div>
            <p className="text-xs uppercase tracking-wide text-navy-400">Agent responsable</p>
            <p className="font-medium text-navy-900">{lead?.name ?? "— non défini —"}</p>
          </div>
        </div>
        {assigned.length > 0 ? (
          <ul className="divide-y divide-navy-100 border-t border-navy-100">
            {assigned.map((a) => (
              <li key={a.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span>
                  <span className="font-medium text-navy-900">{a.name}</span>{" "}
                  <span className="text-navy-400">— {a.role}</span>
                </span>
                <span className="flex items-center gap-2">
                  {canSetLead && a.id !== lead?.id ? (
                    <button
                      onClick={() => setLead(a.id)}
                      className="text-xs font-semibold uppercase text-navy-600 hover:underline"
                    >
                      Désigner responsable
                    </button>
                  ) : null}
                  {canAssign ? (
                    <button
                      onClick={() => remove(a.id, a.name)}
                      className="text-xs font-semibold uppercase text-federal-accent hover:underline"
                    >
                      Retirer
                    </button>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="border-t border-navy-100 px-4 py-3 text-sm text-navy-500">
            Aucun agent affecté.
          </p>
        )}
      </div>

      {canAssign ? (
        <form onSubmit={add} className="flex flex-wrap items-end gap-2 rounded-lg border border-navy-200 bg-navy-50 p-3">
          <Field label="Affecter un agent" className="min-w-[220px] flex-1">
            <Select name="agentId" defaultValue="">
              <option value="">Sélectionner…</option>
              {agents.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Rôle" className="min-w-[160px]">
            <Input name="role" placeholder="Agent affecté" />
          </Field>
          <Button size="sm" type="submit" disabled={busy}>
            Affecter
          </Button>
        </form>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chefs d'accusation du dossier
// ---------------------------------------------------------------------------

export function InvestigationCharges({
  investigationId,
  charges,
  chargeOptions,
  casePersons,
  canEdit,
}: {
  investigationId: string;
  charges: { linkId: string; title: string; personName: string | null }[];
  chargeOptions: { id: string; label: string; category: string }[];
  casePersons: Opt[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"catalog" | "custom">("catalog");

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    const { ok, json } = await req(`/api/investigations/${investigationId}/charges`, "POST", {
      chargeId: mode === "catalog" ? fd.get("chargeId") || undefined : undefined,
      title: mode === "custom" ? fd.get("title") || undefined : undefined,
      personId: fd.get("personId") || undefined,
    });
    setBusy(false);
    if (!ok) return toast("error", json.error ?? "Échec.");
    (e.target as HTMLFormElement).reset();
    toast("success", "Chef d'accusation ajouté.");
    router.refresh();
  }

  async function remove(linkId: string) {
    const { ok, json } = await req(`/api/investigations/${investigationId}/charges`, "DELETE", {
      linkId,
    });
    if (!ok) return toast("error", json.error ?? "Échec.");
    toast("success", "Chef d'accusation retiré.");
    router.refresh();
  }

  return (
    <div className="space-y-3 text-sm">
      {charges.length === 0 ? (
        <p className="text-navy-500">Aucun chef d'accusation enregistré.</p>
      ) : (
        <ul className="divide-y divide-navy-100 rounded-lg border border-navy-200 bg-white">
          {charges.map((c) => (
            <li key={c.linkId} className="flex items-center justify-between px-4 py-2.5">
              <span>
                {c.title}
                {c.personName ? <span className="text-navy-400"> — {c.personName}</span> : null}
              </span>
              {canEdit ? (
                <button
                  onClick={() => remove(c.linkId)}
                  className="text-xs font-semibold uppercase text-federal-accent hover:underline"
                >
                  Retirer
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {canEdit ? (
        <form onSubmit={add} className="space-y-2 rounded-lg border border-navy-200 bg-navy-50 p-3">
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => setMode("catalog")}
              className={`rounded-full border px-3 py-1 ${
                mode === "catalog"
                  ? "border-navy-800 bg-navy-800 text-white"
                  : "border-navy-200 text-navy-600"
              }`}
            >
              Référentiel
            </button>
            <button
              type="button"
              onClick={() => setMode("custom")}
              className={`rounded-full border px-3 py-1 ${
                mode === "custom"
                  ? "border-navy-800 bg-navy-800 text-white"
                  : "border-navy-200 text-navy-600"
              }`}
            >
              Intitulé libre
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {mode === "catalog" ? (
              <Field label="Chef d'accusation">
                <Select name="chargeId" defaultValue="">
                  <option value="">Sélectionner…</option>
                  {chargeOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : (
              <Field label="Intitulé">
                <Input name="title" minLength={2} />
              </Field>
            )}
            <Field label="Personne (facultatif)">
              <Select name="personId" defaultValue="">
                <option value="">— toutes / non précisé —</option>
                {casePersons.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Button size="sm" type="submit" disabled={busy}>
            {busy ? "Ajout…" : "Ajouter"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
