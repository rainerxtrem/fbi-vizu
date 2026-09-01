"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { APPLICATION_STATUS } from "@/lib/constants";
import { labelOptions } from "@/lib/i18n";

type Opt = { id: string; label: string };

async function patch(id: string, body: Record<string, unknown>) {
  const r = await fetch(`/api/applications/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { ok: r.ok, json: await r.json().catch(() => ({})) };
}

export function ApplicationWorkflow({
  applicationId,
  initial,
  recruiters,
  canReview,
  canDecide,
}: {
  applicationId: string;
  initial: {
    status: string;
    assignedRecruiterId: string | null;
    notes: string | null;
    interviewNotes: string | null;
    backgroundCheckNotes: string | null;
    decision: string | null;
  };
  recruiters: Opt[];
  canReview: boolean;
  canDecide: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  if (!canReview) {
    return (
      <p className="text-sm text-navy-500">
        Statut : {APPLICATION_STATUS[initial.status]?.label ?? initial.status}. Vous n&apos;avez pas
        la permission d&apos;instruire cette candidature.
      </p>
    );
  }

  async function quick(body: Record<string, unknown>) {
    setBusy(true);
    const { ok, json } = await patch(applicationId, body);
    setBusy(false);
    if (!ok) return toast("error", json.error ?? "Échec.");
    toast("success", "Candidature mise à jour.");
    router.refresh();
  }

  async function saveNotes(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    const { ok, json } = await patch(applicationId, {
      notes: fd.get("notes") ?? "",
      interviewNotes: fd.get("interviewNotes") ?? "",
      backgroundCheckNotes: fd.get("backgroundCheckNotes") ?? "",
      decision: fd.get("decision") ?? "",
    });
    setBusy(false);
    if (!ok) return toast("error", json.error ?? "Échec.");
    toast("success", "Notes enregistrées.");
    router.refresh();
  }

  const statusOpts = labelOptions(APPLICATION_STATUS).filter(
    ([v]) => canDecide || !["APPROVED", "REJECTED"].includes(v),
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Statut">
          <Select
            value={initial.status}
            disabled={busy}
            onChange={(e) => quick({ status: e.target.value })}
          >
            {statusOpts.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Recruteur assigné">
          <Select
            value={initial.assignedRecruiterId ?? ""}
            disabled={busy}
            onChange={(e) => quick({ assignedRecruiterId: e.target.value })}
          >
            <option value="">— personne —</option>
            {recruiters.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <form onSubmit={saveNotes} className="space-y-3">
        <Field label="Notes de dossier">
          <Textarea name="notes" rows={3} defaultValue={initial.notes ?? ""} />
        </Field>
        <Field label="Notes d'entretien">
          <Textarea name="interviewNotes" rows={3} defaultValue={initial.interviewNotes ?? ""} />
        </Field>
        <Field label="Enquête de moralité">
          <Textarea
            name="backgroundCheckNotes"
            rows={3}
            defaultValue={initial.backgroundCheckNotes ?? ""}
          />
        </Field>
        <Field label="Décision motivée">
          <Textarea name="decision" rows={2} defaultValue={initial.decision ?? ""} />
        </Field>
        <Button size="sm" type="submit" disabled={busy}>
          {busy ? "Enregistrement…" : "Enregistrer les notes"}
        </Button>
      </form>
    </div>
  );
}
