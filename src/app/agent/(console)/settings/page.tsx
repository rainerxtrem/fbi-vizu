import { requireAgent } from "@/lib/auth";
import { effectivePermissions, RANK_LABELS, type Rank } from "@/lib/rbac";
import { PageTitle } from "@/components/agent/ui";
import { Card, CardHeader, CardBody } from "@/components/ui/card";

export default async function SettingsPage() {
  const actor = await requireAgent();
  const perms = Array.from(effectivePermissions(actor)).sort();

  return (
    <div className="max-w-3xl">
      <PageTitle title="Settings" subtitle="Your account and access" />
      <div className="space-y-6">
        <Card>
          <CardHeader title="Account" />
          <CardBody className="space-y-2 text-sm">
            <Row label="Name" value={actor.name} />
            <Row label="Email" value={actor.email} />
            <Row label="Platform Role" value={actor.isAdmin ? "Administrator" : "Standard"} />
            {actor.agent ? (
              <>
                <Row label="Badge Number" value={actor.agent.badgeNumber} />
                <Row label="Rank" value={RANK_LABELS[actor.agent.rank as Rank]} />
                <Row label="Title" value={actor.agent.title} />
                <Row label="Division" value={actor.agent.division} />
                <Row label="Field Office" value={actor.agent.fieldOfficeName ?? "Headquarters"} />
                <Row label="Status" value={actor.agent.status} />
              </>
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Your Permissions" description={`${perms.length} effective permissions`} />
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
          <CardHeader title="Security" />
          <CardBody className="text-sm text-navy-600">
            <p>
              All activity in this console is logged. Sessions expire after 8 hours of
              inactivity. If you believe your account has been compromised, contact the
              platform administrator immediately.
            </p>
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
