"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { TIP_STATUS } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { options } from "@/lib/i18n";

type Opt = { id: string; label: string };

async function req(url: string, method: string, body: unknown) {
  const r = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { ok: r.ok, json: await r.json().catch(() => ({})) };
}

const STATUS_OPTS = options(
  Object.fromEntries(Object.entries(TIP_STATUS).map(([k, v]) => [k, v.label])) as Record<
    string,
    string
  >,
);

export function TipControls({
  tipId,
  status,
  assignedToId,
  investigationId,
  agents,
  investigations,
  canAssign,
}: {
  tipId: string;
  status: string;
  assignedToId: string | null;
  investigationId: string | null;
  agents: Opt[];
  investigations: Opt[];
  canAssign: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    const { ok, json } = await req(`/api/tips/${tipId}`, "PATCH", body);
    setBusy(false);
    if (!ok) return toast("error", json.error ?? "Échec.");
    toast("success", "Renseignement mis à jour.");
    router.refresh();
  }

  if (!canAssign) {
    return (
      <p className="text-sm text-navy-500">
        Statut : {TIP_STATUS[status]?.label ?? status}. Vous n&apos;avez pas la permission de le
        traiter.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Field label="Statut">
        <Select
          value={status}
          disabled={busy}
          onChange={(e) => patch({ status: e.target.value })}
        >
          {STATUS_OPTS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Assigné à">
        <Select
          value={assignedToId ?? ""}
          disabled={busy}
          onChange={(e) => patch({ assignedToId: e.target.value })}
        >
          <option value="">— personne —</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Enquête liée">
        <Select
          value={investigationId ?? ""}
          disabled={busy}
          onChange={(e) => patch({ investigationId: e.target.value })}
        >
          <option value="">— aucune —</option>
          {investigations.map((i) => (
            <option key={i.id} value={i.id}>
              {i.label}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  );
}

export function TipNotes({
  tipId,
  notes,
}: {
  tipId: string;
  notes: { id: string; body: string; author: string | null; createdAt: string }[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!body.trim()) return;
    setBusy(true);
    const { ok, json } = await req(`/api/tips/${tipId}/notes`, "POST", { body });
    setBusy(false);
    if (!ok) return toast("error", json.error ?? "Échec.");
    setBody("");
    toast("success", "Note ajoutée.");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Note interne (visible des agents uniquement)…"
        />
        <Button size="sm" onClick={add} disabled={busy}>
          {busy ? "Enregistrement…" : "Ajouter une note"}
        </Button>
      </div>
      {notes.length === 0 ? (
        <p className="text-sm text-navy-500">Aucune note interne.</p>
      ) : (
        notes.map((n) => (
          <div key={n.id} className="rounded-lg border border-navy-200 bg-white p-3">
            <p className="whitespace-pre-line text-sm text-navy-800">{n.body}</p>
            <p className="mt-1.5 text-xs text-navy-400">
              {n.author ?? "Inconnu"} · {formatDateTime(n.createdAt)}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
