"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm";

type Opt = { id: string; label: string };

async function req(url: string, method: string, body?: unknown) {
  const r = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { ok: r.ok, json: await r.json().catch(() => ({})) };
}

const ROLE_OPTS: [string, string][] = [
  ["SUSPECT", "Suspect"],
  ["VICTIM", "Victime"],
  ["WITNESS", "Témoin"],
  ["ASSOCIATE", "Associé"],
  ["PERSON_OF_INTEREST", "Personne d'intérêt"],
];
const ROLE_LABEL = Object.fromEntries(ROLE_OPTS);

const EVIDENCE_TYPE_OPTS: [string, string][] = [
  ["PHYSICAL", "Physique"],
  ["DIGITAL", "Numérique"],
  ["DOCUMENT", "Document"],
  ["PHOTO", "Photographie"],
  ["VIDEO", "Vidéo"],
  ["AUDIO", "Audio"],
  ["FIREARM", "Arme à feu"],
  ["NARCOTIC", "Stupéfiant"],
  ["FINANCIAL", "Financier"],
  ["BIOLOGICAL", "Biologique"],
  ["OTHER", "Autre"],
];
const EVIDENCE_TYPE_LABEL = Object.fromEntries(EVIDENCE_TYPE_OPTS);

// ---------------------------------------------------------------------------
// Suppression d'une enquête (corbeille)
// ---------------------------------------------------------------------------

export function InvestigationDelete({
  investigationId,
  caseNumber,
}: {
  investigationId: string;
  caseNumber: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);

  async function del() {
    const ok = await confirm({
      title: `Placer l'enquête ${caseNumber} dans la corbeille ?`,
      message:
        "Le dossier disparaît des listes, recherches et pages publiques. Il reste restaurable depuis la Corbeille, où il peut aussi être supprimé définitivement.",
      confirmLabel: "Mettre à la corbeille",
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    const { ok: done, json } = await req(`/api/investigations/${investigationId}`, "DELETE");
    setBusy(false);
    if (!done) return toast("error", json.error ?? "Échec.");
    toast("success", "Enquête déplacée vers la corbeille.");
    router.push("/agent/investigations");
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-navy-600">
        Retire ce dossier de la base active. Restaurable depuis la Corbeille.
      </p>
      <Button variant="danger" size="sm" onClick={del} disabled={busy}>
        {busy ? "Suppression…" : "Mettre à la corbeille"}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preuves — modification / suppression
// ---------------------------------------------------------------------------

export function InvestigationEvidence({
  items,
  casePersons,
  canDownload,
  caps,
}: {
  items: {
    id: string;
    evidenceNumber: string;
    type: string;
    title: string;
    description: string | null;
    chainOfCustody: string | null;
    personId: string | null;
    collectedAt: string;
    collectedByName: string | null;
    fileUrl: string | null;
  }[];
  casePersons: Opt[];
  canDownload: boolean;
  caps: { edit: boolean; del: boolean };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<string | null>(null);

  async function save(id: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const { ok, json } = await req(`/api/evidence/${id}`, "PATCH", {
      title: fd.get("title"),
      type: fd.get("type"),
      description: fd.get("description") || undefined,
      chainOfCustody: fd.get("chainOfCustody") || undefined,
      personId: fd.get("personId") || "",
    });
    if (!ok) return toast("error", json.error ?? "Échec.");
    toast("success", "Preuve mise à jour.");
    setEditing(null);
    router.refresh();
  }

  async function del(id: string, num: string) {
    const ok = await confirm({
      title: `Retirer la preuve #${num} ?`,
      message: "Elle est placée dans la corbeille et reste restaurable.",
      confirmLabel: "Mettre à la corbeille",
      danger: true,
    });
    if (!ok) return;
    const { ok: done, json } = await req(`/api/evidence/${id}`, "DELETE");
    if (!done) return toast("error", json.error ?? "Échec.");
    toast("success", "Preuve déplacée vers la corbeille.");
    router.refresh();
  }

  if (items.length === 0) {
    return <p className="text-sm text-navy-500">Aucune preuve enregistrée.</p>;
  }

  return (
    <div className="divide-y divide-navy-100 rounded-lg border border-navy-200 bg-white">
      {items.map((e) => (
        <div key={e.id} className="px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium text-navy-900">
                <span className="font-mono text-xs text-navy-500">#{e.evidenceNumber}</span>{" "}
                {e.title}
              </p>
              <p className="text-xs text-navy-500">
                {EVIDENCE_TYPE_LABEL[e.type] ?? e.type}
                {e.collectedByName ? ` · ${e.collectedByName}` : ""}
              </p>
              {e.description ? (
                <p className="mt-1 text-sm text-navy-600">{e.description}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {e.fileUrl && canDownload ? (
                <a
                  href={e.fileUrl}
                  target="_blank"
                  className="text-xs font-semibold uppercase text-navy-600 hover:underline"
                >
                  Télécharger
                </a>
              ) : null}
              {caps.edit ? (
                <button
                  onClick={() => setEditing(editing === e.id ? null : e.id)}
                  className="text-xs font-semibold uppercase text-navy-600 hover:underline"
                >
                  {editing === e.id ? "Fermer" : "Modifier"}
                </button>
              ) : null}
              {caps.del ? (
                <button
                  onClick={() => del(e.id, e.evidenceNumber)}
                  className="text-xs font-semibold uppercase text-federal-accent hover:underline"
                >
                  Supprimer
                </button>
              ) : null}
            </div>
          </div>

          {editing === e.id ? (
            <form
              onSubmit={(ev) => save(e.id, ev)}
              className="mt-3 grid gap-3 border-t border-navy-100 pt-3 sm:grid-cols-2"
            >
              <Field label="Intitulé" className="sm:col-span-2">
                <Input name="title" defaultValue={e.title} required />
              </Field>
              <Field label="Type">
                <Select name="type" defaultValue={e.type}>
                  {EVIDENCE_TYPE_OPTS.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Personne liée">
                <Select name="personId" defaultValue={e.personId ?? ""}>
                  <option value="">—</option>
                  {casePersons.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Description" className="sm:col-span-2">
                <Textarea name="description" rows={2} defaultValue={e.description ?? ""} />
              </Field>
              <Field label="Chaîne de possession" className="sm:col-span-2">
                <Input name="chainOfCustody" defaultValue={e.chainOfCustody ?? ""} />
              </Field>
              <div className="sm:col-span-2">
                <Button size="sm" type="submit">
                  Enregistrer
                </Button>
              </div>
            </form>
          ) : null}
        </div>
      ))}
    </div>
  );
}

const WTYPE_OPTS: [string, string][] = [
  ["ARREST", "Arrestation"],
  ["SEARCH", "Perquisition"],
  ["SURVEILLANCE", "Surveillance"],
  ["SEIZURE", "Saisie"],
];
const WTYPE_LABEL = Object.fromEntries(WTYPE_OPTS);

const WSTATUS_OPTS: [string, string][] = [
  ["REQUESTED", "Demandé"],
  ["APPROVED", "Approuvé"],
  ["ACTIVE", "Actif"],
  ["EXECUTED", "Exécuté"],
  ["EXPIRED", "Expiré"],
  ["DENIED", "Refusé"],
];
const WSTATUS_LABEL = Object.fromEntries(WSTATUS_OPTS);
const WSTATUS_TONE: Record<string, string> = {
  REQUESTED: "amber",
  APPROVED: "blue",
  ACTIVE: "green",
  EXECUTED: "slate",
  EXPIRED: "slate",
  DENIED: "red",
};

// ---------------------------------------------------------------------------
// Personnes liées à l'enquête
// ---------------------------------------------------------------------------

export function InvestigationPersons({
  investigationId,
  linked,
  allPersons,
  caps,
}: {
  investigationId: string;
  linked: { linkId: string; personId: string; name: string; alias: string | null; role: string }[];
  allPersons: Opt[];
  caps: { link: boolean; createNew: boolean };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"existing" | "new">("existing");

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const { ok, json } = await req(`/api/investigations/${investigationId}/persons`, "POST", {
      personId: mode === "existing" ? fd.get("personId") || undefined : undefined,
      fullName: mode === "new" ? fd.get("fullName") || undefined : undefined,
      role: fd.get("role"),
      notes: fd.get("notes") || undefined,
    });
    setBusy(false);
    if (!ok) return toast("error", json.error ?? "Échec.");
    (e.target as HTMLFormElement).reset();
    toast("success", "Personne ajoutée au dossier.");
    router.refresh();
  }

  async function unlink(linkId: string, name: string) {
    const ok = await confirm({
      title: `Retirer ${name} du dossier ?`,
      message: "La fiche de la personne n'est pas supprimée, seul le lien avec ce dossier l'est.",
      confirmLabel: "Retirer",
      danger: true,
    });
    if (!ok) return;
    const { ok: done, json } = await req(
      `/api/investigations/${investigationId}/persons`,
      "DELETE",
      { linkId },
    );
    if (!done) return toast("error", json.error ?? "Échec.");
    toast("success", "Personne retirée.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {linked.length === 0 ? (
        <p className="text-sm text-navy-500">Aucune personne liée.</p>
      ) : (
        <div className="space-y-2">
          {linked.map((p) => (
            <div
              key={p.linkId}
              className="flex items-center justify-between rounded-lg border border-navy-200 bg-white px-4 py-3"
            >
              <a
                href={`/agent/suspects/${p.personId}`}
                className="min-w-0 flex-1 hover:underline"
              >
                <p className="font-medium text-navy-900">{p.name}</p>
                {p.alias ? <p className="text-xs text-navy-500">« {p.alias} »</p> : null}
              </a>
              <div className="flex items-center gap-2">
                <Badge>{ROLE_LABEL[p.role] ?? p.role}</Badge>
                {caps.link ? (
                  <button
                    onClick={() => unlink(p.linkId, p.name)}
                    className="text-xs font-semibold uppercase text-federal-accent hover:underline"
                  >
                    Retirer
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {caps.link ? (
        <div className="rounded-lg border border-navy-200 bg-navy-50 p-4">
          <p className="mb-3 text-sm font-bold uppercase tracking-wide text-navy-700">
            Ajouter une personne
          </p>
          <div className="mb-3 flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => setMode("existing")}
              className={`rounded-full border px-3 py-1 ${
                mode === "existing"
                  ? "border-navy-800 bg-navy-800 text-white"
                  : "border-navy-200 text-navy-600"
              }`}
            >
              Personne existante
            </button>
            {caps.createNew ? (
              <button
                type="button"
                onClick={() => setMode("new")}
                className={`rounded-full border px-3 py-1 ${
                  mode === "new"
                    ? "border-navy-800 bg-navy-800 text-white"
                    : "border-navy-200 text-navy-600"
                }`}
              >
                Nouvelle fiche
              </button>
            ) : null}
          </div>
          <form onSubmit={add} className="grid gap-3 sm:grid-cols-2">
            {mode === "existing" ? (
              <Field label="Personne" className="sm:col-span-2">
                <Select name="personId" required defaultValue="">
                  <option value="" disabled>
                    Sélectionner…
                  </option>
                  {allPersons.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : (
              <Field label="Nom complet" className="sm:col-span-2" required>
                <Input name="fullName" required minLength={2} />
              </Field>
            )}
            <Field label="Rôle">
              <Select name="role" defaultValue="SUSPECT">
                {ROLE_OPTS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Note (facultatif)">
              <Input name="notes" />
            </Field>
            <div className="sm:col-span-2">
              <Button size="sm" type="submit" disabled={busy}>
                {busy ? "Ajout…" : "Ajouter au dossier"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mandats
// ---------------------------------------------------------------------------

export function InvestigationWarrants({
  investigationId,
  warrants,
  casePersons,
  caps,
}: {
  investigationId: string;
  warrants: {
    id: string;
    warrantNumber: string;
    type: string;
    status: string;
    personId: string | null;
    personName: string | null;
    issuingJudge: string | null;
    description: string | null;
    issuedDate: string | null;
    expiryDate: string | null;
  }[];
  casePersons: Opt[];
  caps: { create: boolean; edit: boolean; approve: boolean; del: boolean };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canModify = caps.edit || caps.approve;

  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const { ok, json } = await req("/api/warrants", "POST", {
      investigationId,
      type: fd.get("type"),
      status: fd.get("status"),
      personId: fd.get("personId") || undefined,
      issuingJudge: fd.get("issuingJudge") || undefined,
      description: fd.get("description") || undefined,
      issuedDate: fd.get("issuedDate") || undefined,
      expiryDate: fd.get("expiryDate") || undefined,
    });
    setBusy(false);
    if (!ok) return toast("error", json.error ?? "Échec.");
    (e.target as HTMLFormElement).reset();
    toast("success", "Mandat créé.");
    router.refresh();
  }

  async function patch(id: string, body: unknown) {
    const { ok, json } = await req(`/api/warrants/${id}`, "PATCH", body);
    if (!ok) return toast("error", json.error ?? "Échec.");
    toast("success", "Mandat mis à jour.");
    setEditing(null);
    router.refresh();
  }

  async function del(id: string, num: string) {
    const ok = await confirm({
      title: `Supprimer le mandat ${num} ?`,
      message: "Cette action est définitive.",
      confirmLabel: "Supprimer",
      danger: true,
    });
    if (!ok) return;
    const { ok: done, json } = await req(`/api/warrants/${id}`, "DELETE");
    if (!done) return toast("error", json.error ?? "Échec.");
    toast("success", "Mandat supprimé.");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {warrants.length === 0 ? (
        <p className="text-sm text-navy-500">Aucun mandat.</p>
      ) : (
        <div className="divide-y divide-navy-100 rounded-lg border border-navy-200 bg-white">
          {warrants.map((w) => (
            <div key={w.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm">
                  <span className="font-mono text-xs text-navy-500">{w.warrantNumber}</span>{" "}
                  · {WTYPE_LABEL[w.type] ?? w.type}
                  {w.personName ? ` · ${w.personName}` : ""}
                </span>
                <div className="flex items-center gap-2">
                  {canModify ? (
                    <select
                      value={w.status}
                      onChange={(e) => patch(w.id, { status: e.target.value })}
                      className="rounded border border-navy-200 bg-white px-2 py-1 text-xs"
                    >
                      {WSTATUS_OPTS.map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Badge tone={WSTATUS_TONE[w.status]}>{WSTATUS_LABEL[w.status] ?? w.status}</Badge>
                  )}
                  {caps.edit ? (
                    <button
                      onClick={() => setEditing(editing === w.id ? null : w.id)}
                      className="text-xs font-semibold uppercase text-navy-600 hover:underline"
                    >
                      {editing === w.id ? "Fermer" : "Modifier"}
                    </button>
                  ) : null}
                  {caps.del ? (
                    <button
                      onClick={() => del(w.id, w.warrantNumber)}
                      className="text-xs font-semibold uppercase text-federal-accent hover:underline"
                    >
                      Supprimer
                    </button>
                  ) : null}
                </div>
              </div>

              {editing === w.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    patch(w.id, {
                      type: fd.get("type"),
                      personId: fd.get("personId") || "",
                      issuingJudge: fd.get("issuingJudge") || undefined,
                      description: fd.get("description") || undefined,
                      issuedDate: fd.get("issuedDate") || undefined,
                      expiryDate: fd.get("expiryDate") || undefined,
                    });
                  }}
                  className="mt-3 grid gap-3 border-t border-navy-100 pt-3 sm:grid-cols-2"
                >
                  <Field label="Type">
                    <Select name="type" defaultValue={w.type}>
                      {WTYPE_OPTS.map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Personne visée">
                    <Select name="personId" defaultValue={w.personId ?? ""}>
                      <option value="">—</option>
                      {casePersons.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Juge">
                    <Input name="issuingJudge" defaultValue={w.issuingJudge ?? ""} />
                  </Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Émis le">
                      <Input name="issuedDate" type="date" defaultValue={w.issuedDate ?? ""} />
                    </Field>
                    <Field label="Expire le">
                      <Input name="expiryDate" type="date" defaultValue={w.expiryDate ?? ""} />
                    </Field>
                  </div>
                  <Field label="Description" className="sm:col-span-2">
                    <Textarea name="description" rows={2} defaultValue={w.description ?? ""} />
                  </Field>
                  <div className="sm:col-span-2">
                    <Button size="sm" type="submit">
                      Enregistrer
                    </Button>
                  </div>
                </form>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {caps.create ? (
        <details className="rounded-lg border border-navy-200 bg-navy-50 p-4">
          <summary className="cursor-pointer text-sm font-bold uppercase tracking-wide text-navy-700">
            + Nouveau mandat
          </summary>
          <form onSubmit={create} className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Type">
              <Select name="type" defaultValue="ARREST">
                {WTYPE_OPTS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Statut">
              <Select name="status" defaultValue="REQUESTED">
                {WSTATUS_OPTS.filter(
                  ([v]) => caps.approve || !["APPROVED", "ACTIVE"].includes(v),
                ).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Personne visée">
              <Select name="personId" defaultValue="">
                <option value="">—</option>
                {casePersons.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Juge">
              <Input name="issuingJudge" placeholder="Hon. …" />
            </Field>
            <Field label="Émis le">
              <Input name="issuedDate" type="date" />
            </Field>
            <Field label="Expire le">
              <Input name="expiryDate" type="date" />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <Textarea name="description" rows={2} />
            </Field>
            <div className="sm:col-span-2">
              <Button size="sm" type="submit" disabled={busy}>
                {busy ? "Création…" : "Créer le mandat"}
              </Button>
            </div>
          </form>
        </details>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Arrestations
// ---------------------------------------------------------------------------

export function InvestigationArrests({
  investigationId,
  arrests,
  casePersons,
  agents,
  caps,
}: {
  investigationId: string;
  arrests: {
    id: string;
    personId: string;
    personName: string;
    date: string;
    location: string | null;
    charges: string | null;
    notes: string | null;
    agentId: string | null;
    agentName: string | null;
  }[];
  casePersons: Opt[];
  agents: Opt[];
  caps: { create: boolean; edit: boolean; del: boolean };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const { ok, json } = await req("/api/arrests", "POST", {
      investigationId,
      personId: fd.get("personId"),
      arrestDate: fd.get("arrestDate") || undefined,
      location: fd.get("location") || undefined,
      charges: fd.get("charges") || undefined,
      notes: fd.get("notes") || undefined,
      arrestingAgentId: fd.get("arrestingAgentId") || undefined,
    });
    setBusy(false);
    if (!ok) return toast("error", json.error ?? "Échec.");
    (e.target as HTMLFormElement).reset();
    toast("success", "Arrestation enregistrée.");
    router.refresh();
  }

  async function patch(id: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const { ok, json } = await req(`/api/arrests/${id}`, "PATCH", {
      personId: fd.get("personId") || undefined,
      arrestDate: fd.get("arrestDate") || undefined,
      location: fd.get("location") || undefined,
      charges: fd.get("charges") || undefined,
      notes: fd.get("notes") || undefined,
      arrestingAgentId: fd.get("arrestingAgentId") || "",
    });
    if (!ok) return toast("error", json.error ?? "Échec.");
    toast("success", "Arrestation mise à jour.");
    setEditing(null);
    router.refresh();
  }

  async function del(id: string, name: string) {
    const ok = await confirm({
      title: `Supprimer l'arrestation de ${name} ?`,
      message: "Cette action est définitive.",
      confirmLabel: "Supprimer",
      danger: true,
    });
    if (!ok) return;
    const { ok: done, json } = await req(`/api/arrests/${id}`, "DELETE");
    if (!done) return toast("error", json.error ?? "Échec.");
    toast("success", "Arrestation supprimée.");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {arrests.length === 0 ? (
        <p className="text-sm text-navy-500">Aucune arrestation.</p>
      ) : (
        <div className="divide-y divide-navy-100 rounded-lg border border-navy-200 bg-white">
          {arrests.map((a) => (
            <div key={a.id} className="px-4 py-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  <span className="font-medium text-navy-900">{a.personName}</span> ·{" "}
                  {a.date}
                  {a.agentName ? ` · ${a.agentName}` : ""}
                  {a.location ? ` · ${a.location}` : ""}
                </span>
                <div className="flex items-center gap-2">
                  {caps.edit ? (
                    <button
                      onClick={() => setEditing(editing === a.id ? null : a.id)}
                      className="text-xs font-semibold uppercase text-navy-600 hover:underline"
                    >
                      {editing === a.id ? "Fermer" : "Modifier"}
                    </button>
                  ) : null}
                  {caps.del ? (
                    <button
                      onClick={() => del(a.id, a.personName)}
                      className="text-xs font-semibold uppercase text-federal-accent hover:underline"
                    >
                      Supprimer
                    </button>
                  ) : null}
                </div>
              </div>
              {a.charges ? <p className="mt-1 text-navy-600">{a.charges}</p> : null}

              {editing === a.id ? (
                <form
                  onSubmit={(e) => patch(a.id, e)}
                  className="mt-3 grid gap-3 border-t border-navy-100 pt-3 sm:grid-cols-2"
                >
                  <Field label="Personne">
                    <Select name="personId" defaultValue={a.personId}>
                      {casePersons.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Date">
                    <Input name="arrestDate" type="date" defaultValue={a.date} />
                  </Field>
                  <Field label="Agent">
                    <Select name="arrestingAgentId" defaultValue={a.agentId ?? ""}>
                      <option value="">—</option>
                      {agents.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Lieu">
                    <Input name="location" defaultValue={a.location ?? ""} />
                  </Field>
                  <Field label="Chefs d'accusation" className="sm:col-span-2">
                    <Input name="charges" defaultValue={a.charges ?? ""} />
                  </Field>
                  <Field label="Notes" className="sm:col-span-2">
                    <Textarea name="notes" rows={2} defaultValue={a.notes ?? ""} />
                  </Field>
                  <div className="sm:col-span-2">
                    <Button size="sm" type="submit">
                      Enregistrer
                    </Button>
                  </div>
                </form>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {caps.create ? (
        <details className="rounded-lg border border-navy-200 bg-navy-50 p-4">
          <summary className="cursor-pointer text-sm font-bold uppercase tracking-wide text-navy-700">
            + Enregistrer une arrestation
          </summary>
          {casePersons.length === 0 ? (
            <p className="mt-3 text-sm text-navy-500">
              Ajoutez d'abord une personne au dossier (onglet « Personnes »).
            </p>
          ) : (
            <form onSubmit={create} className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Personne" required>
                <Select name="personId" required defaultValue="">
                  <option value="" disabled>
                    Sélectionner…
                  </option>
                  {casePersons.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Date">
                <Input name="arrestDate" type="date" />
              </Field>
              <Field label="Agent interpellateur">
                <Select name="arrestingAgentId" defaultValue="">
                  <option value="">— Moi —</option>
                  {agents.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Lieu">
                <Input name="location" />
              </Field>
              <Field label="Chefs d'accusation" className="sm:col-span-2">
                <Input name="charges" />
              </Field>
              <Field label="Notes" className="sm:col-span-2">
                <Textarea name="notes" rows={2} />
              </Field>
              <div className="sm:col-span-2">
                <Button size="sm" type="submit" disabled={busy}>
                  {busy ? "Enregistrement…" : "Enregistrer l'arrestation"}
                </Button>
              </div>
            </form>
          )}
        </details>
      ) : null}
    </div>
  );
}
