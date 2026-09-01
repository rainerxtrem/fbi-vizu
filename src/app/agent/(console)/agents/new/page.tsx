import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rankLevel, type Rank } from "@/lib/rbac";
import { PageTitle } from "@/components/agent/ui";
import { Breadcrumbs } from "@/components/ui/misc";
import { Card, CardBody } from "@/components/ui/card";
import { AgentCreateForm } from "@/components/agent/agent-create-form";
import { APPLICATION_POSITION } from "@/lib/constants";

export const dynamic = "force-dynamic";

const POSITION_TITLE: Record<string, string> = {
  SPECIAL_AGENT: "Special Agent",
  INTELLIGENCE_ANALYST: "Analyste du renseignement",
  CRIME_ANALYST: "Analyste criminel",
  TACTICAL_AGENT: "Agent tactique",
  CYBERCRIME_SPECIALIST: "Spécialiste cybercriminalité",
  FORENSIC_SPECIALIST: "Spécialiste médico-légal",
  ADMINISTRATIVE_STAFF: "Personnel administratif",
};

export default async function NewAgentPage({
  searchParams,
}: {
  searchParams: { application?: string };
}) {
  const actor = await requirePermission("agents.manage");

  const maxLevel =
    actor.agent?.rank === "DIRECTOR" ? -1 : rankLevel((actor.agent?.rank ?? "NAT") as Rank);
  const canGrantAdmin = actor.isAdmin || actor.agent?.rank === "DIRECTOR";

  const offices = await prisma.fieldOffice.findMany({ orderBy: { isHq: "desc" } });

  let prefill:
    | { name?: string; email?: string; applicationId?: string; title?: string }
    | undefined;
  let prefillPosition: string | null = null;
  if (searchParams.application) {
    const app = await prisma.application.findUnique({
      where: { id: searchParams.application },
      include: { hiredAgent: true },
    });
    if (!app) notFound();
    prefillPosition = app.position;
    prefill = {
      applicationId: app.id,
      name: `${app.firstName} ${app.lastName}`.trim(),
      email: app.email,
      title: POSITION_TITLE[app.position] ?? "Special Agent",
    };
  }

  return (
    <div className="max-w-3xl">
      <Breadcrumbs
        items={[{ label: "Agents", href: "/agent/agents" }, { label: "Recruter" }]}
      />
      <PageTitle
        title="Recruter un agent"
        subtitle={
          prefill
            ? "Depuis une candidature approuvée"
            : "Créer un compte agent et ses accès à la console"
        }
      />
      {prefill ? (
        <Card className="mb-4">
          <CardBody className="text-sm text-navy-600">
            Candidature liée :{" "}
            <span className="font-medium text-navy-900">{prefill.name}</span>
            {prefillPosition ? ` · ${APPLICATION_POSITION[prefillPosition] ?? prefillPosition}` : ""}
          </CardBody>
        </Card>
      ) : null}
      <Card>
        <CardBody>
          <AgentCreateForm
            offices={offices.map((o) => ({ id: o.id, label: o.name }))}
            maxLevel={maxLevel}
            canGrantAdmin={canGrantAdmin}
            prefill={prefill}
          />
        </CardBody>
      </Card>
    </div>
  );
}
