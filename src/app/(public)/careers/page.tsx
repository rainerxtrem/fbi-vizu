import type { Metadata } from "next";
import { PageHeader } from "@/components/public/page-header";
import { ButtonLink } from "@/components/ui/button";
import { APPLICATION_POSITION } from "@/lib/constants";

export const metadata: Metadata = { title: "Careers" };

const POSITIONS: Record<string, string> = {
  SPECIAL_AGENT:
    "Lead federal investigations, conduct interviews, execute warrants, and testify in court.",
  INTELLIGENCE_ANALYST:
    "Fuse information from multiple sources to identify threats and support operations.",
  CRIME_ANALYST:
    "Analyze patterns across cases to support investigative strategy and resource allocation.",
  TACTICAL_AGENT:
    "Serve on specialized teams for high-risk arrests, protective operations, and crisis response.",
  CYBERCRIME_SPECIALIST:
    "Investigate network intrusions, fraud schemes, and digital evidence.",
  FORENSIC_SPECIALIST:
    "Process crime scenes and analyze physical and biological evidence in the laboratory.",
  ADMINISTRATIVE_STAFF:
    "Support agency operations through finance, human resources, records, and logistics.",
};

export default function CareersPage() {
  return (
    <div>
      <PageHeader
        title="Careers at the FIA"
        intro="A career with the Federal Investigative Agency is a career of consequence. Explore the roles that keep San Andreas safe."
        crumbs={[{ label: "Home", href: "/" }, { label: "Careers" }]}
      />
      <div className="container-fia py-12">
        <h2 className="text-2xl font-bold">Open Positions</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {Object.entries(POSITIONS).map(([k, d]) => (
            <div key={k} className="rounded-lg border border-navy-200 bg-white p-5">
              <h3 className="text-base font-semibold text-navy-900">
                {APPLICATION_POSITION[k]}
              </h3>
              <p className="mt-2 text-sm text-navy-600">{d}</p>
              <ButtonLink href="/apply" size="sm" variant="secondary" className="mt-4">
                Apply
              </ButtonLink>
            </div>
          ))}
        </div>

        <div id="benefits" className="mt-14 scroll-mt-32">
          <h2 className="text-2xl font-bold">Benefits</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3 text-sm text-navy-700">
            {[
              ["Comprehensive health coverage", "Medical, dental, and vision for agents and families."],
              ["Retirement", "Defined-benefit pension with early retirement for agents."],
              ["Training", "Paid academy, ongoing certification, and tuition assistance."],
              ["Paid leave", "Generous annual, sick, and family leave."],
              ["Career mobility", "Rotational assignments across divisions and field offices."],
              ["Service recognition", "Awards, promotions, and leadership development."],
            ].map(([t, d]) => (
              <div key={t} className="rounded-lg border border-navy-200 bg-navy-50 p-4">
                <h3 className="font-semibold text-navy-900">{t}</h3>
                <p className="mt-1">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
