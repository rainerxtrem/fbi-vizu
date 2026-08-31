import { RANK_ABBR, RANK_LABELS, type Rank } from "@/lib/rbac";
import type { Actor } from "@/lib/rbac";
import { AGENT_STATUS } from "@/lib/constants";

export function AgentBadge({ actor }: { actor: Actor }) {
  if (!actor.agent) {
    return (
      <div className="text-right">
        <p className="text-sm font-semibold text-navy-900">{actor.name}</p>
        <p className="text-xs text-navy-500">Administrateur de la plateforme</p>
      </div>
    );
  }
  const a = actor.agent;
  const rank = a.rank as Rank;
  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className="text-sm font-semibold text-navy-900">{actor.name}</p>
        <p className="text-xs text-navy-500">
          {RANK_LABELS[rank]} ({RANK_ABBR[rank]})
        </p>
        <p className="text-[11px] text-navy-400">
          <span className="font-mono">{a.badgeNumber}</span>
          {a.fieldOfficeName ? ` · ${a.fieldOfficeName}` : ""}
          {" · "}
          <span
            className={
              a.status === "ACTIVE" ? "text-emerald-600" : "text-amber-600"
            }
          >
            {AGENT_STATUS[a.status] ?? a.status}
          </span>
        </p>
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-800 text-xs font-bold text-white">
        {actor.name
          .split(" ")
          .slice(0, 2)
          .map((p) => p[0])
          .join("")}
      </div>
    </div>
  );
}
