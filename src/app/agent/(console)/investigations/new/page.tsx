import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageTitle } from "@/components/agent/ui";
import { Breadcrumbs } from "@/components/ui/misc";
import { InvestigationForm } from "@/components/agent/investigation-form";
import { RANK_ABBR, type Rank } from "@/lib/rbac";

export default async function NewInvestigationPage() {
  await requirePermission("investigation.create");

  const [agents, offices] = await Promise.all([
    prisma.agent.findMany({
      where: { status: "ACTIVE" },
      include: { user: true },
      orderBy: { rank: "desc" },
    }),
    prisma.fieldOffice.findMany({ orderBy: { isHq: "desc" } }),
  ]);

  return (
    <div className="max-w-4xl">
      <Breadcrumbs
        items={[
          { label: "Enquêtes", href: "/agent/investigations" },
          { label: "Créer" },
        ]}
      />
      <PageTitle title="Créer une enquête" subtitle="Ouvrir un nouveau dossier fédéral" />
      <InvestigationForm
        agents={agents.map((a) => ({
          id: a.id,
          label: `${a.user.name} · ${RANK_ABBR[a.rank as Rank]} · ${a.badgeNumber}`,
        }))}
        offices={offices.map((o) => ({ id: o.id, label: o.name }))}
      />
    </div>
  );
}
