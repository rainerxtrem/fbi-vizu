"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function TipForm({
  mostWantedId,
  compact,
}: {
  mostWantedId?: string;
  compact?: boolean;
}) {
  const { toast } = useToast();
  const [anon, setAnon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    const fd = new FormData(e.currentTarget);

    let fileUrl: string | undefined;
    const file = fd.get("attachment") as File | null;
    if (file && file.size > 0) {
      const up = new FormData();
      up.append("file", file);
      const r = await fetch("/api/uploads", { method: "POST", body: up });
      const j = await r.json();
      if (j.ok) fileUrl = j.data.url;
    }

    const payload = {
      anonymous: anon,
      name: anon ? "" : String(fd.get("name") ?? ""),
      email: anon ? "" : String(fd.get("email") ?? ""),
      phone: anon ? "" : String(fd.get("phone") ?? ""),
      subject: String(fd.get("subject") ?? ""),
      location: String(fd.get("location") ?? ""),
      incidentDate: String(fd.get("incidentDate") ?? ""),
      description: String(fd.get("description") ?? ""),
      mostWantedId: mostWantedId ?? "",
      fileUrl: fileUrl ?? "",
    };

    const res = await fetch("/api/tips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      if (json.issues?.fieldErrors) {
        const fe: Record<string, string> = {};
        for (const [k, v] of Object.entries(json.issues.fieldErrors)) {
          fe[k] = (v as string[])[0];
        }
        setErrors(fe);
      }
      toast("error", json.error ?? "Could not submit your tip.");
      return;
    }
    setResult(json.data.publicId);
    toast("success", "Your tip has been submitted.");
  }

  if (result) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
        <h3 className="mt-3 text-lg font-semibold text-navy-900">
          Thank you. Your information has been submitted to the Federal
          Investigative Agency.
        </h3>
        <p className="mt-2 text-sm text-navy-600">
          Reference number: <span className="font-mono font-semibold">{result}</span>
        </p>
        <p className="mt-1 text-xs text-navy-500">
          Keep this number for your records. An agent will review your submission.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <label className="flex items-center gap-2 text-sm text-navy-700">
        <input
          type="checkbox"
          checked={anon}
          onChange={(e) => setAnon(e.target.checked)}
          className="h-4 w-4 rounded border-navy-300"
        />
        Submit anonymously (contact fields will be omitted)
      </label>

      {!anon ? (
        <div className={compact ? "space-y-4" : "grid gap-4 sm:grid-cols-3"}>
          <Field label="Name" htmlFor="name" error={errors.name}>
            <Input id="name" name="name" autoComplete="name" />
          </Field>
          <Field label="Email" htmlFor="email" error={errors.email}>
            <Input id="email" name="email" type="email" autoComplete="email" />
          </Field>
          <Field label="Phone" htmlFor="phone" error={errors.phone}>
            <Input id="phone" name="phone" type="tel" autoComplete="tel" />
          </Field>
        </div>
      ) : null}

      <Field label="Subject" htmlFor="subject" required error={errors.subject}>
        <Input id="subject" name="subject" required placeholder="Brief summary of your information" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Location" htmlFor="location" error={errors.location}>
          <Input id="location" name="location" placeholder="Where did this occur / where is the subject?" />
        </Field>
        <Field label="Date" htmlFor="incidentDate" error={errors.incidentDate}>
          <Input id="incidentDate" name="incidentDate" type="date" />
        </Field>
      </div>

      <Field
        label="Description of the information"
        htmlFor="description"
        required
        error={errors.description}
        hint="Include names, vehicles, dates, and anything else that may help investigators."
      >
        <Textarea id="description" name="description" rows={6} required />
      </Field>

      <Field label="Attachment" htmlFor="attachment" hint="Optional. Photo, video, PDF or audio — 25 MB max.">
        <input
          id="attachment"
          name="attachment"
          type="file"
          className="block w-full text-sm text-navy-600 file:mr-3 file:rounded-md file:border-0 file:bg-navy-800 file:px-3 file:py-2 file:text-xs file:font-semibold file:uppercase file:text-white"
        />
      </Field>

      <Button type="submit" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit a Tip"}
      </Button>
      <p className="text-xs text-navy-400">
        Providing false information to a federal agency is a criminal offense.
      </p>
    </form>
  );
}
