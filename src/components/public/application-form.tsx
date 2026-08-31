"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Field, Input, Textarea, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { APPLICATION_POSITION } from "@/lib/constants";

async function uploadIfPresent(fd: FormData, name: string): Promise<string | undefined> {
  const f = fd.get(name) as File | null;
  if (!f || f.size === 0) return undefined;
  const up = new FormData();
  up.append("file", f);
  const r = await fetch("/api/uploads", { method: "POST", body: up });
  const j = await r.json();
  return j.ok ? (j.data.url as string) : undefined;
}

export function ApplicationForm() {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [ref, setRef] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    const fd = new FormData(e.currentTarget);

    const [resumeUrl, idUrl, certUrl, additionalUrl] = await Promise.all([
      uploadIfPresent(fd, "resume"),
      uploadIfPresent(fd, "identification"),
      uploadIfPresent(fd, "certDoc"),
      uploadIfPresent(fd, "additional"),
    ]);

    const payload = {
      firstName: fd.get("firstName"),
      lastName: fd.get("lastName"),
      dob: fd.get("dob"),
      phone: fd.get("phone"),
      email: fd.get("email"),
      address: fd.get("address"),
      city: fd.get("city"),
      state: fd.get("state"),
      zip: fd.get("zip"),
      currentOccupation: fd.get("currentOccupation"),
      priorLeExperience: fd.get("priorLeExperience"),
      militaryExperience: fd.get("militaryExperience"),
      education: fd.get("education"),
      certifications: fd.get("certifications"),
      position: fd.get("position"),
      whyJoin: fd.get("whyJoin"),
      whyGoodCandidate: fd.get("whyGoodCandidate"),
      difficultDecision: fd.get("difficultDecision"),
      pressureExperience: fd.get("pressureExperience"),
      certified: fd.get("certified") === "on",
      resumeUrl,
      idUrl,
      certUrl,
      additionalUrl,
    };

    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      if (json.issues?.fieldErrors) {
        const fe: Record<string, string> = {};
        for (const [k, v] of Object.entries(json.issues.fieldErrors))
          fe[k] = (v as string[])[0];
        setErrors(fe);
      }
      toast("error", json.error ?? "Could not submit your application.");
      return;
    }
    setRef(json.data.publicId);
    toast("success", "Application submitted.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (ref) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
        <h3 className="mt-3 text-xl font-semibold">Application received</h3>
        <p className="mt-2 text-navy-600">
          Your application reference is{" "}
          <span className="font-mono font-semibold">{ref}</span>. A recruiter
          will contact you regarding next steps.
        </p>
      </div>
    );
  }

  const fileInput =
    "block w-full text-sm text-navy-600 file:mr-3 file:rounded-md file:border-0 file:bg-navy-800 file:px-3 file:py-2 file:text-xs file:font-semibold file:uppercase file:text-white";

  return (
    <form onSubmit={onSubmit} className="space-y-10">
      <fieldset className="space-y-4">
        <legend className="text-lg font-bold uppercase tracking-wide">
          Personal Information
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First Name" required error={errors.firstName}>
            <Input name="firstName" required />
          </Field>
          <Field label="Last Name" required error={errors.lastName}>
            <Input name="lastName" required />
          </Field>
          <Field label="Date of Birth" error={errors.dob}>
            <Input name="dob" type="date" />
          </Field>
          <Field label="Phone" required error={errors.phone}>
            <Input name="phone" type="tel" required />
          </Field>
          <Field label="Email" required error={errors.email}>
            <Input name="email" type="email" required />
          </Field>
          <Field label="Address" error={errors.address}>
            <Input name="address" />
          </Field>
          <Field label="City" error={errors.city}>
            <Input name="city" />
          </Field>
          <Field label="State" error={errors.state}>
            <Input name="state" defaultValue="San Andreas" />
          </Field>
          <Field label="ZIP Code" error={errors.zip}>
            <Input name="zip" />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-bold uppercase tracking-wide">Experience</legend>
        <Field label="Current Occupation">
          <Input name="currentOccupation" />
        </Field>
        <Field label="Previous Law Enforcement Experience">
          <Textarea name="priorLeExperience" />
        </Field>
        <Field label="Military Experience">
          <Textarea name="militaryExperience" />
        </Field>
        <Field label="Education">
          <Textarea name="education" rows={2} />
        </Field>
        <Field label="Certifications">
          <Textarea name="certifications" rows={2} />
        </Field>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-bold uppercase tracking-wide">Position</legend>
        <Field label="Position Applied For" required error={errors.position}>
          <Select name="position" required defaultValue="SPECIAL_AGENT">
            {Object.entries(APPLICATION_POSITION).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-bold uppercase tracking-wide">Questions</legend>
        <Field label="Why do you want to join the FIA?">
          <Textarea name="whyJoin" />
        </Field>
        <Field label="What makes you a good candidate?">
          <Textarea name="whyGoodCandidate" />
        </Field>
        <Field label="Describe a situation where you had to make a difficult decision.">
          <Textarea name="difficultDecision" />
        </Field>
        <Field label="Describe your experience working under pressure.">
          <Textarea name="pressureExperience" />
        </Field>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-bold uppercase tracking-wide">Documents</legend>
        <Field label="Resume">
          <input type="file" name="resume" className={fileInput} />
        </Field>
        <Field label="Identification">
          <input type="file" name="identification" className={fileInput} />
        </Field>
        <Field label="Certifications">
          <input type="file" name="certDoc" className={fileInput} />
        </Field>
        <Field label="Additional Documents">
          <input type="file" name="additional" className={fileInput} />
        </Field>
      </fieldset>

      <label className="flex items-start gap-2 text-sm text-navy-700">
        <input type="checkbox" name="certified" required className="mt-1 h-4 w-4" />
        I certify that the information provided is accurate and complete.
      </label>
      {errors.certified ? (
        <p className="text-xs text-federal-accent">{errors.certified}</p>
      ) : null}

      <Button type="submit" size="lg" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit Application"}
      </Button>
    </form>
  );
}
