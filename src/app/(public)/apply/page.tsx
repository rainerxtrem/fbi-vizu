import type { Metadata } from "next";
import { PageHeader } from "@/components/public/page-header";
import { ApplicationForm } from "@/components/public/application-form";

export const metadata: Metadata = {
  title: "Apply",
  description: "Candidatez pour devenir Special Agent, analyste ou personnel du FBI.",
};

export default function ApplyPage() {
  return (
    <div>
      <PageHeader
        title="Apply"
        intro="Rejoignez le Federal Bureau of Investigation. Développez votre carrière. Servez votre communauté. Rendez justice."
        crumbs={[
          { label: "Accueil", href: "/" },
          { label: "Carrières", href: "/careers" },
          { label: "Apply" },
        ]}
      />
      <div className="container-fia grid gap-10 py-12 lg:grid-cols-[1fr_300px]">
        <div className="rounded-lg border border-navy-200 bg-white p-6 sm:p-8">
          <ApplicationForm />
        </div>
        <aside className="space-y-4 text-sm text-navy-600 lg:sticky lg:top-32 lg:self-start">
          <div className="rounded-lg border border-navy-200 bg-navy-50 p-4">
            <h3 className="font-semibold text-navy-800">Conditions d'éligibilité</h3>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>Résident de l'État de San Andreas</li>
              <li>Âge minimum : 21 ans</li>
              <li>Permis de conduire valide</li>
              <li>Aucune condamnation pour crime</li>
              <li>Capacité à réussir une enquête de moralité</li>
            </ul>
          </div>
          <div className="rounded-lg border border-navy-200 bg-navy-50 p-4">
            <h3 className="font-semibold text-navy-800">Processus de recrutement</h3>
            <p className="mt-1">
              Candidature → Examen → Entretien → Enquête de moralité → Offre
              conditionnelle → Académie.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
