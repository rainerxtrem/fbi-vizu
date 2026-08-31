"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

export function InlineStatus({
  endpoint,
  value,
  options,
  field = "status",
  disabled,
}: {
  endpoint: string;
  value: string;
  options: string[];
  field?: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [val, setVal] = useState(value);

  async function change(next: string) {
    setBusy(true);
    setVal(next);
    const r = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: next }),
    });
    setBusy(false);
    if (!r.ok) {
      const j = await r.json();
      setVal(value);
      return toast("error", j.error ?? "Échec de la mise à jour.");
    }
    toast("success", "Mis à jour.");
    router.refresh();
  }

  return (
    <select
      value={val}
      disabled={busy || disabled}
      onChange={(e) => change(e.target.value)}
      className="rounded border border-navy-200 bg-white px-2 py-1 text-xs"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {STATUS_TR[o] ?? o.replace(/_/g, " ")}
        </option>
      ))}
    </select>
  );
}

const STATUS_TR: Record<string, string> = {
  // Candidatures
  SUBMITTED: "Soumise",
  UNDER_REVIEW: "En cours d'examen",
  INTERVIEW: "Entretien",
  BACKGROUND_CHECK: "Enquête de moralité",
  APPROVED: "Approuvée",
  REJECTED: "Refusée",
  WITHDRAWN: "Retirée",
  // Renseignements
  NEW: "Nouveau",
  REVIEWING: "En cours d'examen",
  ASSIGNED: "Assigné",
  ACTIONED: "Traité",
  // Actualités
  DRAFT: "Brouillon",
  PUBLISHED: "Publié",
  // Commun
  CLOSED: "Clôturé",
  ARCHIVED: "Archivé",
};
