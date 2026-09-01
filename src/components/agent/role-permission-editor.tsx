"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm";
import { RANK_LABELS, RANK_ABBR, type Rank } from "@/lib/rbac";

type Cell = {
  permission: string;
  granted: boolean;
  isDefault: boolean;
  overridden: boolean;
};
type Row = { rank: Rank; permissions: Cell[] };

const GROUP_LABEL: Record<string, string> = {
  investigation: "Enquêtes",
  note: "Notes",
  timeline: "Chronologie",
  person: "Personnes",
  suspect: "Suspects",
  evidence: "Preuves",
  document: "Documents",
  warrant: "Mandats",
  arrest: "Arrestations",
  mostwanted: "Most Wanted",
  applications: "Candidatures",
  tips: "Renseignements",
  news: "Actualités",
  agents: "Agents",
  reports: "Rapports",
  audit: "Journal d'activité",
  system: "Administration",
};

export function RolePermissionEditor({ matrix }: { matrix: Row[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const editable = matrix.filter((r) => r.rank !== "DIRECTOR");
  const [rank, setRank] = useState<Rank>(editable[0]?.rank ?? "NAT");
  const [busy, setBusy] = useState<string | null>(null);

  const row = matrix.find((r) => r.rank === rank)!;
  const overrideCount = row.permissions.filter((p) => p.overridden).length;

  const groups = useMemo(() => {
    const by = new Map<string, Cell[]>();
    for (const c of row.permissions) {
      const g = c.permission.split(".")[0];
      if (!by.has(g)) by.set(g, []);
      by.get(g)!.push(c);
    }
    return [...by.entries()];
  }, [row]);

  async function put(permission: string, value: "grant" | "revoke" | "default") {
    setBusy(permission);
    const r = await fetch("/api/roles", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rank, permission, value }),
    });
    const j = await r.json();
    setBusy(null);
    if (!r.ok) return toast("error", j.error ?? "Échec.");
    router.refresh();
  }

  async function resetRank() {
    const ok = await confirm({
      title: `Réinitialiser le grade ${RANK_LABELS[rank]} ?`,
      message: "Toutes les personnalisations de ce grade seront supprimées et les permissions par défaut du code seront rétablies.",
      confirmLabel: "Réinitialiser",
      danger: true,
    });
    if (!ok) return;
    const res = await fetch("/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rank }),
    });
    if (!res.ok) return toast("error", "Échec de la réinitialisation.");
    toast("success", "Grade réinitialisé.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {editable.map((r) => {
          const oc = r.permissions.filter((p) => p.overridden).length;
          return (
            <button
              key={r.rank}
              onClick={() => setRank(r.rank)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                r.rank === rank
                  ? "border-navy-800 bg-navy-800 text-white"
                  : "border-navy-200 text-navy-600 hover:bg-navy-50"
              }`}
              title={RANK_LABELS[r.rank]}
            >
              {RANK_ABBR[r.rank]}
              {oc > 0 ? <span className="ml-1 text-federal-accent">•</span> : null}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between rounded-lg border border-navy-200 bg-navy-50 px-4 py-2 text-sm">
        <span>
          <span className="font-semibold text-navy-900">{RANK_LABELS[rank]}</span>
          <span className="text-navy-500">
            {" "}
            · {row.permissions.filter((p) => p.granted).length} permissions
            {overrideCount > 0 ? ` · ${overrideCount} personnalisée(s)` : ""}
          </span>
        </span>
        {overrideCount > 0 ? (
          <button onClick={resetRank} className="text-xs font-semibold uppercase text-federal-accent hover:underline">
            Réinitialiser le grade
          </button>
        ) : null}
      </div>

      <div className="space-y-4">
        {groups.map(([group, cells]) => (
          <div key={group} className="rounded-lg border border-navy-200 bg-white">
            <p className="border-b border-navy-100 bg-navy-50/60 px-4 py-2 text-xs font-bold uppercase tracking-wide text-navy-600">
              {GROUP_LABEL[group] ?? group}
            </p>
            <ul className="divide-y divide-navy-50">
              {cells.map((c) => (
                <li key={c.permission} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
                  <label className="flex flex-1 items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={c.granted}
                      disabled={busy === c.permission}
                      onChange={(e) => put(c.permission, e.target.checked ? "grant" : "revoke")}
                      className="h-4 w-4"
                    />
                    <code className="text-[13px] text-navy-800">{c.permission}</code>
                    {c.overridden ? (
                      <Badge tone={c.granted ? "green" : "red"}>
                        {c.granted ? "ajoutée" : "retirée"}
                      </Badge>
                    ) : null}
                  </label>
                  {c.overridden ? (
                    <button
                      onClick={() => put(c.permission, "default")}
                      className="text-xs font-semibold uppercase text-navy-500 hover:underline"
                    >
                      Défaut
                    </button>
                  ) : (
                    <span className="text-[11px] uppercase text-navy-300">défaut</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="text-xs text-navy-400">
        Le grade <strong>Director</strong> conserve tous les accès en permanence et n&apos;est pas
        listé ici. Les changements s&apos;appliquent dans un délai de 20 secondes (cache), ou à la
        prochaine connexion de l&apos;agent.
      </p>
    </div>
  );
}
