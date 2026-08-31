import { requirePermission } from "@/lib/auth";
import { PageTitle } from "@/components/agent/ui";
import { Breadcrumbs } from "@/components/ui/misc";
import { SuspectForm } from "@/components/agent/suspect-form";

export default async function NewSuspectPage() {
  await requirePermission("suspect.create");
  return (
    <div className="max-w-3xl">
      <Breadcrumbs items={[{ label: "Suspects", href: "/agent/suspects" }, { label: "Create" }]} />
      <PageTitle title="Create Person Record" subtitle="Add a suspect, witness or person of interest" />
      <SuspectForm mode="create" />
    </div>
  );
}
