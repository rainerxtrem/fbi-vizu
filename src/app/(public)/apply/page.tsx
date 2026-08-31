import type { Metadata } from "next";
import { PageHeader } from "@/components/public/page-header";
import { ApplicationForm } from "@/components/public/application-form";

export const metadata: Metadata = {
  title: "Join the FIA",
  description: "Apply to become a Special Agent, analyst, or professional staff member of the FIA.",
};

export default function ApplyPage() {
  return (
    <div>
      <PageHeader
        title="Join the FIA"
        intro="Build your career. Serve your community. Make a difference."
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Careers", href: "/careers" },
          { label: "Apply" },
        ]}
      />
      <div className="container-fia grid gap-10 py-12 lg:grid-cols-[1fr_300px]">
        <div className="rounded-lg border border-navy-200 bg-white p-6 sm:p-8">
          <ApplicationForm />
        </div>
        <aside className="space-y-4 text-sm text-navy-600 lg:sticky lg:top-32 lg:self-start">
          <div className="rounded-lg border border-navy-200 bg-navy-50 p-4">
            <h3 className="font-semibold text-navy-800">Eligibility</h3>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>Resident of the State of San Andreas</li>
              <li>Minimum age 21</li>
              <li>Valid driver&apos;s license</li>
              <li>No felony convictions</li>
              <li>Able to pass a background investigation</li>
            </ul>
          </div>
          <div className="rounded-lg border border-navy-200 bg-navy-50 p-4">
            <h3 className="font-semibold text-navy-800">Hiring process</h3>
            <p className="mt-1">
              Application → Review → Interview → Background Check → Conditional
              Offer → Academy.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
