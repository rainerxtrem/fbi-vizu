import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/public/page-header";
import { AGENCY } from "@/lib/constants";
import { RANK_LABELS, type Rank } from "@/lib/rbac";

export const metadata: Metadata = { title: "À propos du FBI" };

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
        title="À propos du FBI"
        intro={`Le ${AGENCY.name} est la principale agence fédérale de police judiciaire et de renseignement intérieur de l'État de San Andreas.`}
        crumbs={[{ label: "Accueil", href: "/" }, { label: "À propos" }]}
      />

      <div className="container-fia space-y-16 py-12">
        <section id="mission">
          <h2 className="text-2xl font-bold">Mission</h2>
          <p className="prose-fia mt-4 max-w-3xl">
            Protéger la population de San Andreas contre les entreprises
            criminelles, les auteurs de violences, la corruption et les menaces
            visant les institutions — et faire respecter la Constitution et
            l'État de droit. Nous poursuivons la justice avec intégrité, au
            service des communautés que nous protégeons.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {["Justice", "Intégrité", "Service"].map((v) => (
              <div key={v} className="rounded-lg border border-navy-200 bg-navy-50 p-5">
                <h3 className="text-lg font-bold text-navy-900">{v}</h3>
              </div>
            ))}
          </div>
        </section>

        <section id="history">
          <h2 className="text-2xl font-bold">Histoire</h2>
          <p className="prose-fia mt-4 max-w-3xl">
            Créé pour regrouper des fonctions d'enquête jusque-là dispersées à
            travers San Andreas, le FBI est devenu une agence fédérale à part
            entière, avec des Field Offices à Los Santos, dans le comté de
            Blaine, à Sandy Shores et à Paleto Bay. Sa Cyber Division, sa
            Criminal Investigative Division et sa Counterterrorism Division
            coordonnent les opérations à l'échelle de l'État.
          </p>
        </section>

        <section id="organization">
          <h2 className="text-2xl font-bold">Organisation</h2>
          <p className="prose-fia mt-4 max-w-3xl">
            Le FBI est dirigé par le Director et le Deputy Director, assistés
            d'Executive Assistant Directors pour les grandes branches. Les
            opérations de terrain sont pilotées par des Special Agents in Charge
            dans chaque Field Office, les Supervisory Special Agents encadrant
            chaque brigade et groupe d'intervention.
          </p>
        </section>

        <section id="leadership">
          <h2 className="text-2xl font-bold">Direction</h2>
          {leaders.length === 0 ? (
            <p className="mt-4 text-navy-500">L'organigramme de direction est en cours de mise à jour.</p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {leaders.map((l) => (
                <div key={l.id} className="rounded-lg border border-navy-200 bg-white p-5">
                  <p className="font-semibold text-navy-900">{l.user.name}</p>
                  <p className="text-sm text-navy-600">{RANK_LABELS[l.rank as Rank]}</p>
                  <p className="mt-1 text-xs text-navy-400">
                    {l.fieldOffice?.name ?? "Quartier général"} · {l.badgeNumber}
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
                  {o.name} {o.isHq ? "· QG" : ""}
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
