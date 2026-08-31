"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm";

interface Props {
  investigationId: string;
  currentStatus: string;
  isPublic: boolean;
  perms: {
    edit: boolean;
    close: boolean;
    publish: boolean;
    createMostWanted: boolean;
    addNote: boolean;
    addEvidence: boolean;
    addTimeline: boolean;
  };
  persons: { id: string; label: string }[];
}

async function api(url: string, method: string, body: unknown) {
  const r = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { ok: r.ok, json: await r.json() };
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Ouverte",
  ACTIVE: "Active",
  SUSPENDED: "Suspendue",
  CLOSED: "Clôturée",
  ARCHIVED: "Archivée",
};

export function CaseStatusControl({ investigationId, currentStatus, isPublic, perms }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);

  async function changeStatus(status: string) {
    if (status === currentStatus) return;
    if (["CLOSED", "ARCHIVED"].includes(status)) {
      const ok = await confirm({
        title: `Passer le dossier au statut « ${STATUS_LABELS[status]} » ?`,
        message: "Le statut du dossier sera mis à jour partout où il apparaît.",
        confirmLabel: status === "CLOSED" ? "Clôturer le dossier" : "Archiver",
        danger: true,
      });
      if (!ok) return;
    }
    setBusy(true);
    const { ok, json } = await api(`/api/investigations/${investigationId}`, "PATCH", { status });
    setBusy(false);
    if (!ok) return toast("error", json.error ?? "Échec de la mise à jour.");
    toast("success", `Statut changé en « ${STATUS_LABELS[status] ?? status} ».`);
    router.refresh();
  }

  async function togglePublic() {
    const next = !isPublic;
    const ok = await confirm({
      title: next ? "Publier le dossier sur le site public ?" : "Retirer le dossier du site public ?",
      message: next
        ? "Un résumé, les chefs d'accusation et la chronologie seront visibles sur FBI.gov."
        : "La page publique du dossier ne sera plus accessible.",
      confirmLabel: next ? "Publier" : "Dépublier",
    });
    if (!ok) return;
    setBusy(true);
    const res = await api(`/api/investigations/${investigationId}`, "PATCH", { isPublic: next });
    setBusy(false);
    if (!res.ok) return toast("error", res.json.error ?? "Échec de la mise à jour.");
    toast("success", next ? "Dossier publié." : "Dossier dépublié.");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <Field label="Statut du dossier">
        <Select
          value={currentStatus}
          disabled={busy || (!perms.edit && !perms.close)}
          onChange={(e) => changeStatus(e.target.value)}
        >
          {["OPEN", "ACTIVE", "SUSPENDED", "CLOSED", "ARCHIVED"].map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
      </Field>
      {perms.publish ? (
        <Button variant={isPublic ? "secondary" : "primary"} size="sm" onClick={togglePublic} disabled={busy}>
          {isPublic ? "Retirer de FBI.gov" : "Publier sur FBI.gov"}
        </Button>
      ) : null}
    </div>
  );
}

export function AddNote({ investigationId }: { investigationId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!body.trim()) return;
    setBusy(true);
    const { ok, json } = await api(`/api/investigations/${investigationId}/notes`, "POST", { body });
    setBusy(false);
    if (!ok) return toast("error", json.error ?? "Échec.");
    setBody("");
    toast("success", "Note ajoutée.");
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="Ajouter une note au dossier…" />
      <Button size="sm" onClick={submit} disabled={busy}>
        {busy ? "Enregistrement…" : "Ajouter une note"}
      </Button>
    </div>
  );
}

export function AddTimelineEntry({ investigationId }: { investigationId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!message.trim()) return;
    setBusy(true);
    const { ok, json } = await api(`/api/investigations/${investigationId}/timeline`, "POST", { message });
    setBusy(false);
    if (!ok) return toast("error", json.error ?? "Échec.");
    setMessage("");
    toast("success", "Entrée de chronologie ajoutée.");
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Décrire une action ou un développement…" />
      <Button size="sm" onClick={submit} disabled={busy}>
        Ajouter
      </Button>
    </div>
  );
}

export function AddEvidence({
  investigationId,
  persons,
}: {
  investigationId: string;
  persons: { id: string; label: string }[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
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
      if (j.ok) fileUrl = j.data.url;
      else {
        setBusy(false);
        return toast("error", j.error ?? "Échec du téléversement.");
      }
    }
    const { ok, json } = await api("/api/evidence", "POST", {
      investigationId,
      title: fd.get("title"),
      type: fd.get("type"),
      description: fd.get("description"),
      chainOfCustody: fd.get("chainOfCustody"),
      personId: fd.get("personId") || undefined,
      fileUrl,
    });
    setBusy(false);
    if (!ok) return toast("error", json.error ?? "Échec.");
    (e.target as HTMLFormElement).reset();
    toast("success", "Preuve enregistrée.");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <Field label="Intitulé" required>
        <Input name="title" required />
      </Field>
      <Field label="Type">
        <Select name="type" defaultValue="PHYSICAL">
          {[
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
          ].map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Description" className="sm:col-span-2">
        <Textarea name="description" rows={2} />
      </Field>
      <Field label="Chaîne de possession">
        <Input name="chainOfCustody" placeholder="Recueillie par / lieu de conservation" />
      </Field>
      <Field label="Personne liée">
        <Select name="personId" defaultValue="">
          <option value="">—</option>
          {persons.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Fichier" className="sm:col-span-2">
        <input type="file" name="file" className="block w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-navy-800 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:uppercase file:text-white" />
      </Field>
      <div className="sm:col-span-2">
        <Button size="sm" type="submit" disabled={busy}>
          {busy ? "Enregistrement…" : "Enregistrer la preuve"}
        </Button>
      </div>
    </form>
  );
}
