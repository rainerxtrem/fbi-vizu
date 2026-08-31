"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";

interface Group {
  label: string;
  items: { title: string; meta: string; href: string }[];
}

export function GlobalSearch() {
  const [q, setQ] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (q.trim().length < 2) {
      setGroups([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      const r = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      const j = await r.json();
      setLoading(false);
      if (j.ok) {
        setGroups(j.data.groups);
        setOpen(true);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
      {loading ? (
        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-navy-400" />
      ) : null}
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => groups.length && setOpen(true)}
        placeholder="Rechercher enquêtes, suspects, preuves, Agents…"
        className="field-input pl-9"
      />
      {open && groups.length > 0 ? (
        <div className="absolute z-50 mt-1 max-h-[70vh] w-full overflow-y-auto rounded-md border border-navy-200 bg-white shadow-xl">
          {groups.map((g) => (
            <div key={g.label} className="border-b border-navy-100 last:border-0">
              <p className="bg-navy-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-navy-500">
                {g.label}
              </p>
              {g.items.map((it, i) => (
                <button
                  key={i}
                  onClick={() => {
                    router.push(it.href);
                    setOpen(false);
                    setQ("");
                  }}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-navy-50"
                >
                  <span className="text-navy-900">{it.title}</span>
                  <span className="text-xs text-navy-400">{it.meta}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
