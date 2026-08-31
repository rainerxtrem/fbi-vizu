"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { NEWS_CATEGORY } from "@/lib/constants";

export function NewsForm({ canPublish }: { canPublish: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: fd.get("title"),
        subtitle: fd.get("subtitle"),
        imageUrl: fd.get("imageUrl"),
        category: fd.get("category"),
        status: fd.get("status"),
        content: fd.get("content"),
      }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) return toast("error", json.error ?? "Failed.");
    toast("success", "Article saved.");
    router.push("/agent/news");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Title" required>
        <Input name="title" required />
      </Field>
      <Field label="Subtitle">
        <Input name="subtitle" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category">
          <Select name="category" defaultValue="PRESS_RELEASE">
            {Object.entries(NEWS_CATEGORY).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select name="status" defaultValue="DRAFT">
            <option value="DRAFT">Draft</option>
            {canPublish ? <option value="PUBLISHED">Published</option> : null}
          </Select>
        </Field>
      </div>
      <Field label="Image URL">
        <Input name="imageUrl" placeholder="https://…" />
      </Field>
      <Field label="Content" required>
        <Textarea name="content" rows={12} required />
      </Field>
      <Button type="submit" disabled={busy}>
        {busy ? "Saving…" : "Save Article"}
      </Button>
    </form>
  );
}
