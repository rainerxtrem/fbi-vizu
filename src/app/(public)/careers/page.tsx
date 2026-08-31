import type { Metadata } from "next";
import { PageHeader } from "@/components/public/page-header";
import { ButtonLink } from "@/components/ui/button";
import { APPLICATION_POSITION } from "@/lib/constants";

export const metadata: Metadata = { title: "Carrières" };

const POSITIONS: Record<string, string> = {
  SPECIAL_AGENT:
    "Diriger des enquêtes fédérales, mener des auditions, exécuter des mandats et témoigner devant les tribunaux.",
  INTELLIGENCE_ANALYST:
    "Recouper des informations de sources multiples pour identifier les menaces et appuyer les opérations.",
  CRIME_ANALYST:
    "Analyser les schémas récurrents entre affaires pour orienter la stratégie d'enquête et l'allocation des ressources.",
  TACTICAL_AGENT:
    "Servir au sein d'équipes spécialisées pour les arrestations à haut risque, les opérations de protection et la gestion de crise.",
  CYBERCRIME_SPECIALIST:
    "Enquêter sur les intrusions réseau, les fraudes et les preuves numériques.",
  FORENSIC_SPECIALIST:
    "Traiter les scènes de crime et analyser les preuves physiques et biologiques en laboratoire.",
  ADMINISTRATIVE_STAFF:
    "Soutenir les opérations de l'agence : finances, ressources humaines, archives et logistique.",
};

export default function CareersPage() {
  return (
    <div>
      <PageHeader
        title="Carrières au FBI"
        intro="Une carrière au Federal Bureau of Investigation est une carrière qui compte. Découvrez les postes qui assurent la sécurité de San Andreas."
        crumbs={[{ label: "Accueil", href: "/" }, { label: "Carrières" }]}
      />
      <div className="container-fia py-12">
        <h2 className="text-2xl font-bold">Postes ouverts</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {Object.entries(POSITIONS).map(([k, d]) => (
            <div key={k} className="rounded-lg border border-navy-200 bg-white p-5">
              <h3 className="text-base font-semibold text-navy-900">
                {APPLICATION_POSITION[k]}
              </h3>
              <p className="mt-2 text-sm text-navy-600">{d}</p>
              <ButtonLink href="/apply" size="sm" variant="secondary" className="mt-4">
                Candidater
              </ButtonLink>
            </div>
          ))}
        </div>

        <div id="benefits" className="mt-14 scroll-mt-32">
          <h2 className="text-2xl font-bold">Avantages</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3 text-sm text-navy-700">
            {[
              ["Couverture santé complète", "Médical, dentaire et optique pour les Agents et leurs familles."],
              ["Retraite", "Régime de retraite à prestations définies avec départ anticipé pour les Agents."],
              ["Formation", "Académie rémunérée, certification continue et aide aux études."],
              ["Congés payés", "Congés annuels, maladie et familiaux généreux."],
              ["Mobilité de carrière", "Affectations tournantes entre divisions et Field Offices."],
              ["Reconnaissance du service", "Distinctions, promotions et développement du leadership."],
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
