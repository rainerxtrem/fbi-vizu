"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm";
import { RANK_LABELS, RANK_ORDER, type Rank } from "@/lib/rbac";

export function RankControl({
  agentId,
  currentRank,
  maxLevel,
}: {
  agentId: string;
  currentRank: Rank;
  maxLevel: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);

  const allowed = RANK_ORDER.filter((_, i) => i < maxLevel || maxLevel === -1);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newRank = String(fd.get("newRank")) as Rank;
    const reason = String(fd.get("reason") ?? "");
    if (newRank === currentRank) return toast("error", "Select a different rank.");

    const promote = RANK_ORDER.indexOf(newRank) > RANK_ORDER.indexOf(currentRank);
    const ok = await confirm({
      title: `${promote ? "Promote" : "Demote"} to ${RANK_LABELS[newRank]}?`,
      message: "This change is recorded in the audit log with your name and the reason.",
      confirmLabel: promote ? "Promote" : "Demote",
      danger: !promote,
    });
    if (!ok) return;

    setBusy(true);
    const r = await fetch(`/api/agents/${agentId}/rank`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newRank, reason }),
    });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) return toast("error", j.error ?? "Failed.");
    toast("success", `Rank changed to ${RANK_LABELS[newRank]}.`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Field label="New Rank">
        <Select name="newRank" defaultValue={currentRank}>
          {allowed.map((r) => (
            <option key={r} value={r}>
              {RANK_LABELS[r]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Justification">
        <Textarea name="reason" rows={2} placeholder="Reason for the change (recorded)" />
      </Field>
      <Button type="submit" size="sm" disabled={busy}>
        {busy ? "Saving…" : "Apply Rank Change"}
      </Button>
    </form>
  );
}
