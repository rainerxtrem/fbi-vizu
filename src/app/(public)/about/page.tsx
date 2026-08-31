import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/public/page-header";
import { AGENCY } from "@/lib/constants";
import { RANK_LABELS, type Rank } from "@/lib/rbac";

export const metadata: Metadata = { title: "About the FIA" };

const LEADERSHIP_RANKS: Rank[] = ["DIRECTOR", "DD", "ADD", "EAD"];

export default async function AboutPage() {
  const [offices, leaders] = await Promise.all([
    prisma.fieldOffice.findMany({ orderBy: { isHq: "desc" } }),
    prisma.agent.findMany({
      where: { rank: { in: LEADERSHIP_RANKS } },
      include: { user: true, fieldOffice: true },
      orderBy: { rank: "desc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="About the FIA"
        intro={`The ${AGENCY.name} is the lead federal law enforcement and domestic intelligence agency of the State of San Andreas.`}
        crumbs={[{ label: "Home", href: "/" }, { label: "About" }]}
      />

      <div className="container-fia space-y-16 py-12">
        <section id="mission">
          <h2 className="text-2xl font-bold">Mission</h2>
          <p className="prose-fia mt-4 max-w-3xl">
            To protect the people of San Andreas from criminal enterprises,
            violent offenders, corruption, and threats to public institutions —
            and to uphold the Constitution and the rule of law. We pursue justice
            with integrity, in service of the communities we protect.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {["Justice", "Integrity", "Service"].map((v) => (
              <div key={v} className="rounded-lg border border-navy-200 bg-navy-50 p-5">
                <h3 className="text-lg font-bold text-navy-900">{v}</h3>
              </div>
            ))}
          </div>
        </section>

        <section id="history">
          <h2 className="text-2xl font-bold">History</h2>
          <p className="prose-fia mt-4 max-w-3xl">
            Established to consolidate fragmented investigative functions across
            San Andreas, the FIA has grown into a full-service federal agency
            with field offices in Los Santos, Blaine County, Sandy Shores, and
            Paleto Bay. Its Cyber Division, Criminal Investigative Division, and
            Counterterrorism Division coordinate operations statewide.
          </p>
        </section>

        <section id="organization">
          <h2 className="text-2xl font-bold">Organization</h2>
          <p className="prose-fia mt-4 max-w-3xl">
            The FIA is led by the Director and Deputy Director, supported by
            Executive Assistant Directors for major branches. Field operations
            are managed by Special Agents in Charge at each field office, with
            Supervisory Special Agents leading individual squads and task forces.
          </p>
        </section>

        <section id="leadership">
          <h2 className="text-2xl font-bold">Leadership</h2>
          {leaders.length === 0 ? (
            <p className="mt-4 text-navy-500">Leadership roster is being updated.</p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {leaders.map((l) => (
                <div key={l.id} className="rounded-lg border border-navy-200 bg-white p-5">
                  <p className="font-semibold text-navy-900">{l.user.name}</p>
                  <p className="text-sm text-navy-600">{RANK_LABELS[l.rank as Rank]}</p>
                  <p className="mt-1 text-xs text-navy-400">
                    {l.fieldOffice?.name ?? "Headquarters"} · {l.badgeNumber}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section id="field-offices">
          <h2 className="text-2xl font-bold">Field Offices</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {offices.map((o) => (
              <div key={o.id} className="rounded-lg border border-navy-200 bg-white p-5">
                <p className="font-semibold text-navy-900">
                  {o.name} {o.isHq ? "· HQ" : ""}
                </p>
                <p className="mt-1 text-sm text-navy-600">{o.address}</p>
                <p className="text-sm text-navy-600">{o.phone}</p>
                <p className="text-sm text-navy-500">{o.email}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
