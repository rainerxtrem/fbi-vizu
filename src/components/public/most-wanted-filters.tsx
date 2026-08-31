"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { MOST_WANTED_FILTERS } from "@/lib/constants";

export function MostWantedFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");

  const activeCategory = params.get("category") ?? "ALL";
  const sort = params.get("sort") ?? "danger";
  const status = params.get("status") ?? "ALL";

  const update = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === "" || v === "ALL") next.delete(k);
        else next.set(k, v);
      }
      next.delete("page");
      startTransition(() => router.push(`${pathname}?${next.toString()}`));
    },
    [params, pathname, router],
  );

  // anti-rebond de la recherche
  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get("q") ?? "") !== q) update({ q: q || null });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher par nom, alias, lieu ou Case Number"
          className="field-input pl-9"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {MOST_WANTED_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => update({ category: f.key })}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide",
              activeCategory === f.key
                ? "border-navy-800 bg-navy-800 text-white"
                : "border-navy-200 text-navy-600 hover:bg-navy-50",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={status}
          onChange={(e) => update({ status: e.target.value })}
          className="field-input w-auto"
        >
          <option value="ALL">Tout statut</option>
          <option value="PUBLISHED">At Large</option>
          <option value="CAPTURED">Captured</option>
          <option value="LOCATED">Localisé</option>
        </select>
        <select
          value={sort}
          onChange={(e) => update({ sort: e.target.value })}
          className="field-input w-auto"
        >
          <option value="danger">Trier : niveau de dangerosité</option>
          <option value="reward">Trier : récompense (décroissante)</option>
          <option value="recent">Trier : publiés récemment</option>
          <option value="name">Trier : nom (A–Z)</option>
        </select>
      </div>
    </div>
  );
}
