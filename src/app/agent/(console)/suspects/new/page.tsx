import { requirePermission } from "@/lib/auth";
import { PageTitle } from "@/components/agent/ui";
import { Breadcrumbs } from "@/components/ui/misc";
import { SuspectForm } from "@/components/agent/suspect-form";

export default async function NewSuspectPage() {
  await requirePermission("suspect.create");
  return (
    <div className="max-w-3xl">
      <Breadcrumbs items={[{ label: "Suspects", href: "/agent/suspects" }, { label: "Créer" }]} />
      <PageTitle title="Créer une fiche de personne" subtitle="Ajouter un suspect, un témoin ou une personne d'intérêt" />
      <SuspectForm mode="create" />
    </div>
  );
}
