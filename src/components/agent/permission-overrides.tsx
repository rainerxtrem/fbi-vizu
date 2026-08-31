"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { PERMISSIONS } from "@/lib/rbac";

export function PermissionOverrides({
  agentId,
  grants,
  revokes,
}: {
  agentId: string;
  grants: string[];
  revokes: string[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [g, setG] = useState<string[]>(grants);
  const [r, setR] = useState<string[]>(revokes);
  const [busy, setBusy] = useState(false);

  function cycle(perm: string) {
    if (g.includes(perm)) {
      setG(g.filter((x) => x !== perm));
      setR([...r, perm]);
    } else if (r.includes(perm)) {
      setR(r.filter((x) => x !== perm));
    } else {
      setG([...g, perm]);
    }
  }

  async function save() {
    setBusy(true);
    const res = await fetch(`/api/agents/${agentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissionGrants: g, permissionRevokes: r }),
    });
    const j = await res.json();
    setBusy(false);
    if (!res.ok) return toast("error", j.error ?? "Failed.");
    toast("success", "Permission overrides saved.");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-navy-500">
        Click to cycle: <span className="text-emerald-600">granted</span> →{" "}
        <span className="text-red-600">revoked</span> → default.
      </p>
      <div className="flex max-h-64 flex-wrap gap-1.5 overflow-y-auto rounded-md border border-navy-200 p-2">
        {PERMISSIONS.map((p) => {
          const state = g.includes(p) ? "grant" : r.includes(p) ? "revoke" : "default";
          return (
            <button
              key={p}
              type="button"
              onClick={() => cycle(p)}
              className={
                "rounded border px-2 py-0.5 text-[11px] font-mono " +
                (state === "grant"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : state === "revoke"
                    ? "border-red-300 bg-red-50 text-red-700 line-through"
                    : "border-navy-200 text-navy-500")
              }
            >
              {p}
            </button>
          );
        })}
      </div>
      <Button size="sm" onClick={save} disabled={busy}>
        {busy ? "Saving…" : "Save Overrides"}
      </Button>
    </div>
  );
}
