import { requireAgent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { effectivePermissions, RANK_LABELS, type Rank } from "@/lib/rbac";
import { AGENT_STATUS } from "@/lib/constants";
import { PageTitle } from "@/components/agent/ui";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { SecuritySettings } from "@/components/agent/security-settings";

export default async function SettingsPage() {
  const actor = await requireAgent();
  const perms = Array.from(effectivePermissions(actor)).sort();
  const me = await prisma.user.findUnique({
    where: { id: actor.userId },
    select: { totpEnabledAt: true },
  });

  return (
    <div className="max-w-3xl">
      <PageTitle title="Paramètres" subtitle="Votre compte et vos accès" />
      <div className="space-y-6">
        <Card>
          <CardHeader title="Compte" />
          <CardBody className="space-y-2 text-sm">
            <Row label="Nom" value={actor.name} />
            <Row label="E-mail" value={actor.email} />
            <Row label="Rôle sur la plateforme" value={actor.isAdmin ? "Administrateur" : "Standard"} />
            {actor.agent ? (
              <>
                <Row label="Matricule" value={actor.agent.badgeNumber} />
                <Row label="Grade" value={RANK_LABELS[actor.agent.rank as Rank]} />
                <Row label="Fonction" value={actor.agent.title} />
                <Row label="Division" value={actor.agent.division} />
                <Row label="Field Office" value={actor.agent.fieldOfficeName ?? "Quartier général"} />
                <Row label="Statut" value={AGENT_STATUS[actor.agent.status] ?? actor.agent.status} />
              </>
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Vos permissions" description={`${perms.length} permissions effectives`} />
          <CardBody>
            <div className="flex flex-wrap gap-1.5">
              {perms.map((p) => (
                <span key={p} className="rounded bg-navy-100 px-1.5 py-0.5 font-mono text-[11px] text-navy-600">
                  {p}
                </span>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Sécurité"
            description="Mot de passe et sessions actives"
          />
          <CardBody className="space-y-4">
            <p className="text-sm text-navy-600">
              Toute activité dans cette console est enregistrée. Les sessions
              expirent après 8 heures. Changer votre mot de passe déconnecte
              automatiquement tous vos autres appareils.
            </p>
            <SecuritySettings twoFactorEnabled={!!me?.totpEnabledAt} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-xs uppercase tracking-wide text-navy-400">{label}</span>
      <span className="text-right text-navy-800">{value || "—"}</span>
    </div>
  );
}
