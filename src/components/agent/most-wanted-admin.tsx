"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm";
import { MOST_WANTED_STATUS_FLOW } from "@/lib/constants";

const NEXT: Record<string, { to: string; label: string; danger?: boolean }[]> = {
  DRAFT: [{ to: "REVIEW", label: "Submit for Review" }],
  REVIEW: [
    { to: "PUBLISHED", label: "Approve & Publish" },
    { to: "DRAFT", label: "Send back to Draft" },
  ],
  PUBLISHED: [
    { to: "CAPTURED", label: "Mark Captured" },
    { to: "LOCATED", label: "Mark Located" },
    { to: "ARCHIVED", label: "Archive", danger: true },
  ],
  CAPTURED: [{ to: "ARCHIVED", label: "Archive" }],
  LOCATED: [{ to: "ARCHIVED", label: "Archive" }],
  ARCHIVED: [],
};

async function patch(id: string, body: unknown) {
  const r = await fetch(`/api/most-wanted/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { ok: r.ok, json: await r.json() };
}

export function MostWantedWorkflow({
  id,
  status,
  caps,
}: {
  id: string;
  status: string;
  caps: { review: boolean; publish: boolean; edit: boolean; archive: boolean; del: boolean };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);

  const transitions = (NEXT[status] ?? []).filter((t) => {
    if (t.to === "REVIEW") return caps.edit || caps.review;
    if (t.to === "PUBLISHED") return caps.publish;
    if (t.to === "DRAFT") return caps.review || caps.publish;
    if (t.to === "ARCHIVED") return caps.archive;
    return caps.edit || caps.publish;
  });

  async function go(to: string, danger?: boolean) {
    const needsConfirm = to === "PUBLISHED" || danger;
    if (needsConfirm) {
      const ok = await confirm({
        title: to === "PUBLISHED" ? "Publish this bulletin to FIA.gov?" : `Move bulletin to ${to}?`,
        message:
          to === "PUBLISHED"
            ? "It will immediately be visible to the public on the Most Wanted page."
            : "This changes the bulletin's workflow state.",
        confirmLabel: to === "PUBLISHED" ? "Publish" : "Confirm",
        danger,
      });
      if (!ok) return;
    }
    setBusy(true);
    const { ok, json } = await patch(id, { status: to });
    setBusy(false);
    if (!ok) return toast("error", json.error ?? "Transition failed.");
    toast("success", `Bulletin moved to ${to}.`);
    router.refresh();
  }

  async function del() {
    const ok = await confirm({
      title: "Delete this bulletin?",
      message: "This permanently removes the Most Wanted record.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    const r = await fetch(`/api/most-wanted/${id}`, { method: "DELETE" });
    if (!r.ok) {
      const j = await r.json();
      return toast("error", j.error ?? "Delete failed.");
    }
    toast("success", "Bulletin deleted.");
    router.push("/agent/most-wanted");
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 text-xs text-navy-500">
        {MOST_WANTED_STATUS_FLOW.map((s, i) => (
          <span key={s} className={s === status ? "font-bold text-navy-900" : ""}>
            {s}
            {i < MOST_WANTED_STATUS_FLOW.length - 1 ? " → " : ""}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {transitions.map((t) => (
          <Button
            key={t.to}
            size="sm"
            variant={t.to === "PUBLISHED" ? "primary" : t.danger ? "danger" : "secondary"}
            disabled={busy}
            onClick={() => go(t.to, t.danger)}
          >
            {t.label}
          </Button>
        ))}
        {caps.del ? (
          <Button size="sm" variant="ghost" onClick={del}>
            Delete
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function MostWantedEditor({
  id,
  initial,
}: {
  id: string;
  initial: Record<string, unknown>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const { ok, json } = await patch(id, {
      fullName: fd.get("fullName"),
      aliases: fd.get("aliases"),
      age: fd.get("age") || undefined,
      photoUrl: fd.get("photoUrl"),
      description: fd.get("description"),
      reward: fd.get("reward") || 0,
      category: fd.get("category"),
      dangerLevel: fd.get("dangerLevel"),
      lastKnownLocation: fd.get("lastKnownLocation"),
      vehicle: fd.get("vehicle"),
      associates: fd.get("associates"),
      knownOrganizations: fd.get("knownOrganizations"),
      dateLastSeen: fd.get("dateLastSeen") || undefined,
      charges: String(fd.get("charges") ?? "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    });
    setBusy(false);
    if (!ok) return toast("error", json.error ?? "Save failed.");
    toast("success", "Bulletin updated.");
    router.refresh();
  }

  const s = (k: string) => (initial[k] == null ? "" : String(initial[k]));

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <Field label="Full Name" required>
        <Input name="fullName" defaultValue={s("fullName")} required />
      </Field>
      <Field label="Aliases">
        <Input name="aliases" defaultValue={s("aliases")} />
      </Field>
      <Field label="Age">
        <Input name="age" type="number" defaultValue={s("age")} />
      </Field>
      <Field label="Reward (USD)">
        <Input name="reward" type="number" defaultValue={s("reward")} />
      </Field>
      <Field label="Photo URL" className="sm:col-span-2">
        <Input name="photoUrl" defaultValue={s("photoUrl")} />
      </Field>
      <Field label="Category">
        <Select name="category" defaultValue={s("category") || "MOST_WANTED"}>
          {["MOST_WANTED", "FUGITIVE", "ORGANIZED_CRIME", "VIOLENT_CRIME", "TERRORISM", "CYBER_CRIME", "DRUG_TRAFFICKING", "WEAPONS", "FINANCIAL_CRIME", "MISSING_PERSON", "SEEKING_INFORMATION"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
      </Field>
      <Field label="Danger Level">
        <Select name="dangerLevel" defaultValue={s("dangerLevel") || "MODERATE"}>
          {["LOW", "MODERATE", "HIGH", "EXTREME"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
      </Field>
      <Field label="Last Known Location">
        <Input name="lastKnownLocation" defaultValue={s("lastKnownLocation")} />
      </Field>
      <Field label="Vehicle">
        <Input name="vehicle" defaultValue={s("vehicle")} />
      </Field>
      <Field label="Date Last Seen">
        <Input name="dateLastSeen" type="date" defaultValue={s("dateLastSeen")} />
      </Field>
      <Field label="Associates">
        <Input name="associates" defaultValue={s("associates")} />
      </Field>
      <Field label="Known Organizations" className="sm:col-span-2">
        <Input name="knownOrganizations" defaultValue={s("knownOrganizations")} />
      </Field>
      <Field label="Charges (one per line)" className="sm:col-span-2">
        <Textarea name="charges" rows={4} defaultValue={s("charges")} />
      </Field>
      <Field label="Public Description" className="sm:col-span-2">
        <Textarea name="description" rows={5} defaultValue={s("description")} required />
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save Bulletin"}
        </Button>
      </div>
    </form>
  );
}
