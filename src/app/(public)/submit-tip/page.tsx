import type { Metadata } from "next";
import { PageHeader } from "@/components/public/page-header";
import { TipForm } from "@/components/public/tip-form";

export const metadata: Metadata = {
  title: "Submit a Tip",
  description:
    "Report information about a crime or a wanted individual to the Federal Investigative Agency.",
};

export default function SubmitTipPage() {
  return (
    <div>
      <PageHeader
        title="Submit a Tip"
        intro="Report suspicious activity, provide information about an ongoing investigation, or help us locate a wanted individual. You may submit anonymously."
        crumbs={[{ label: "Home", href: "/" }, { label: "Submit a Tip" }]}
      />
      <div className="container-fia grid gap-10 py-12 lg:grid-cols-[1fr_320px]">
        <div className="rounded-lg border border-navy-200 bg-white p-6">
          <TipForm />
        </div>
        <aside className="space-y-4 text-sm text-navy-600">
          <div className="rounded-lg border border-navy-200 bg-navy-50 p-4">
            <h3 className="font-semibold text-navy-800">In an emergency</h3>
            <p className="mt-1">
              If you are reporting a crime in progress or a threat to life, call
              your local emergency line immediately. This form is not monitored
              in real time.
            </p>
          </div>
          <div className="rounded-lg border border-navy-200 bg-navy-50 p-4">
            <h3 className="font-semibold text-navy-800">What happens next</h3>
            <p className="mt-1">
              Every tip receives a reference number and is routed to the
              appropriate unit for review. Agents may follow up if you provide
              contact details.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
