"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm";

export function SuspectDelete({
  suspectId,
  name,
  linkedCounts,
}: {
  suspectId: string;
  name: string;
  linkedCounts: { investigations: number; arrests: number; mostWanted: number };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);

  async function del() {
    const parts: string[] = [];
    if (linkedCounts.investigations)
      parts.push(`${linkedCounts.investigations} lien(s) d'enquête`);
    if (linkedCounts.arrests) parts.push(`${linkedCounts.arrests} arrestation(s)`);
    if (linkedCounts.mostWanted)
      parts.push(`${linkedCounts.mostWanted} bulletin(s) Most Wanted`);

    const ok = await confirm({
      title: `Placer la fiche de ${name} dans la corbeille ?`,
      message:
        "La fiche et tous ses liens sont conservés et peuvent être restaurés depuis la Corbeille." +
        (parts.length ? ` Éléments liés : ${parts.join(", ")}.` : ""),
      confirmLabel: "Mettre à la corbeille",
      danger: true,
    });
    if (!ok) return;

    setBusy(true);
    const r = await fetch(`/api/suspects/${suspectId}`, { method: "DELETE" });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) return toast("error", j.error ?? "Échec de la suppression.");
    toast("success", "Fiche déplacée vers la corbeille.");
    router.push("/agent/suspects");
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-navy-600">
        Retire cette fiche de la base active. Elle reste restaurable depuis la
        Corbeille ; sa suppression définitive s&apos;y effectue ensuite.
      </p>
      <Button variant="danger" size="sm" onClick={del} disabled={busy}>
        {busy ? "Suppression…" : "Mettre à la corbeille"}
      </Button>
    </div>
  );
}
