import type { Metadata } from "next";
import { PageHeader } from "@/components/public/page-header";
import { TipForm } from "@/components/public/tip-form";

export const metadata: Metadata = {
  title: "Submit a Tip",
  description:
    "Signaler des informations sur un crime ou un individu recherché au Federal Bureau of Investigation.",
};

export default function SubmitTipPage() {
  return (
    <div>
      <PageHeader
        title="Soumettre un renseignement"
        intro="Signalez une activité suspecte, fournissez des informations sur une enquête en cours ou aidez-nous à localiser un individu recherché. Vous pouvez le faire de manière anonyme."
        crumbs={[{ label: "Accueil", href: "/" }, { label: "Submit a Tip" }]}
      />
      <div className="container-fia grid gap-10 py-12 lg:grid-cols-[1fr_320px]">
        <div className="rounded-lg border border-navy-200 bg-white p-6">
          <TipForm />
        </div>
        <aside className="space-y-4 text-sm text-navy-600">
          <div className="rounded-lg border border-navy-200 bg-navy-50 p-4">
            <h3 className="font-semibold text-navy-800">En cas d'urgence</h3>
            <p className="mt-1">
              Si vous signalez un crime en cours ou une menace pour la vie
              d'autrui, appelez immédiatement les services d'urgence. Ce
              formulaire n'est pas surveillé en temps réel.
            </p>
          </div>
          <div className="rounded-lg border border-navy-200 bg-navy-50 p-4">
            <h3 className="font-semibold text-navy-800">Que se passe-t-il ensuite</h3>
            <p className="mt-1">
              Chaque renseignement reçoit un numéro de référence et est
              transmis à l'unité compétente pour examen. Les Agents peuvent vous
              recontacter si vous fournissez vos coordonnées.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
