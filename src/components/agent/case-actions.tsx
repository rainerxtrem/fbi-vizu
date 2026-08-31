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

export function CaseStatusControl({ investigationId, currentStatus, isPublic, perms }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);

  async function changeStatus(status: string) {
    if (status === currentStatus) return;
    if (["CLOSED", "ARCHIVED"].includes(status)) {
      const ok = await confirm({
        title: `Move case to ${status}?`,
        message: "This updates the case status everywhere it appears.",
        confirmLabel: status === "CLOSED" ? "Close Case" : "Archive",
        danger: true,
      });
      if (!ok) return;
    }
    setBusy(true);
    const { ok, json } = await api(`/api/investigations/${investigationId}`, "PATCH", { status });
    setBusy(false);
    if (!ok) return toast("error", json.error ?? "Update failed.");
    toast("success", `Status changed to ${status}.`);
    router.refresh();
  }

  async function togglePublic() {
    const next = !isPublic;
    const ok = await confirm({
      title: next ? "Publish case to the public site?" : "Remove case from public site?",
      message: next
        ? "A summary, charges and timeline will be visible on FIA.gov."
        : "The public case page will no longer be accessible.",
      confirmLabel: next ? "Publish" : "Unpublish",
    });
    if (!ok) return;
    setBusy(true);
    const res = await api(`/api/investigations/${investigationId}`, "PATCH", { isPublic: next });
    setBusy(false);
    if (!res.ok) return toast("error", res.json.error ?? "Update failed.");
    toast("success", next ? "Case published." : "Case unpublished.");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <Field label="Case Status">
        <Select
          value={currentStatus}
          disabled={busy || (!perms.edit && !perms.close)}
          onChange={(e) => changeStatus(e.target.value)}
        >
          {["OPEN", "ACTIVE", "SUSPENDED", "CLOSED", "ARCHIVED"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </Field>
      {perms.publish ? (
        <Button variant={isPublic ? "secondary" : "primary"} size="sm" onClick={togglePublic} disabled={busy}>
          {isPublic ? "Unpublish from FIA.gov" : "Publish to FIA.gov"}
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
    if (!ok) return toast("error", json.error ?? "Failed.");
    setBody("");
    toast("success", "Note added.");
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="Add a case note…" />
      <Button size="sm" onClick={submit} disabled={busy}>
        {busy ? "Saving…" : "Add Note"}
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
    if (!ok) return toast("error", json.error ?? "Failed.");
    setMessage("");
    toast("success", "Timeline entry added.");
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe an action or development…" />
      <Button size="sm" onClick={submit} disabled={busy}>
        Add
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
        return toast("error", j.error ?? "Upload failed.");
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
    if (!ok) return toast("error", json.error ?? "Failed.");
    (e.target as HTMLFormElement).reset();
    toast("success", "Evidence logged.");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <Field label="Title" required>
        <Input name="title" required />
      </Field>
      <Field label="Type">
        <Select name="type" defaultValue="PHYSICAL">
          {["PHYSICAL", "DIGITAL", "DOCUMENT", "PHOTO", "VIDEO", "AUDIO", "FIREARM", "NARCOTIC", "FINANCIAL", "BIOLOGICAL", "OTHER"].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </Select>
      </Field>
      <Field label="Description" className="sm:col-span-2">
        <Textarea name="description" rows={2} />
      </Field>
      <Field label="Chain of Custody">
        <Input name="chainOfCustody" placeholder="Collected by / location" />
      </Field>
      <Field label="Linked Person">
        <Select name="personId" defaultValue="">
          <option value="">—</option>
          {persons.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="File" className="sm:col-span-2">
        <input type="file" name="file" className="block w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-navy-800 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:uppercase file:text-white" />
      </Field>
      <div className="sm:col-span-2">
        <Button size="sm" type="submit" disabled={busy}>
          {busy ? "Saving…" : "Log Evidence"}
        </Button>
      </div>
    </form>
  );
}
