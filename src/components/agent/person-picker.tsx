"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { RISK_LEVEL } from "@/lib/constants";

type Person = { id: string; fullName: string; alias: string | null; riskLevel: string };

/**
 * Debounced type-ahead that resolves a Person by name/alias against
 * `GET /api/persons?q=`. The chosen id is written to a hidden `<input name>`
 * so it participates in a normal form submit.
 */
export function PersonPicker({
  name,
  required,
  placeholder = "Rechercher une personne par nom ou alias…",
}: {
  name: string;
  required?: boolean;
  placeholder?: string;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Person | null>(null);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (selected || q.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      const r = await fetch(`/api/persons?q=${encodeURIComponent(q.trim())}`);
      const j = await r.json();
      setLoading(false);
      if (j.ok) {
        setResults(j.data.persons);
        setActive(0);
        setOpen(true);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q, selected]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const p = results[active];
      if (p) {
        setSelected(p);
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  if (selected) {
    return (
      <div className="flex items-center justify-between rounded-md border border-navy-300 bg-navy-50 px-3 py-2">
        <input type="hidden" name={name} value={selected.id} />
        <span className="text-sm text-navy-900">
          {selected.fullName}
          {selected.alias ? <span className="text-navy-500"> « {selected.alias} »</span> : null}
          <span className="ml-2 text-xs text-navy-400">
            {RISK_LEVEL[selected.riskLevel]?.label ?? selected.riskLevel}
          </span>
        </span>
        <button
          type="button"
          onClick={() => {
            setSelected(null);
            setQ("");
          }}
          className="text-navy-400 hover:text-federal-accent"
          aria-label="Changer de personne"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={boxRef} className="relative">
      {required ? <input type="hidden" name={name} value="" required /> : null}
      {loading ? (
        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-navy-400" />
      ) : null}
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="field-input"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls="person-picker-list"
      />
      {open && results.length > 0 ? (
        <div
          id="person-picker-list"
          role="listbox"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-navy-200 bg-white shadow-xl"
        >
          {results.map((p, i) => (
            <button
              key={p.id}
              type="button"
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => {
                setSelected(p);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${
                i === active ? "bg-navy-100" : "hover:bg-navy-50"
              }`}
            >
              <span className="text-navy-900">
                {p.fullName}
                {p.alias ? <span className="text-navy-500"> « {p.alias} »</span> : null}
              </span>
              <span className="text-xs text-navy-400">
                {RISK_LEVEL[p.riskLevel]?.label ?? p.riskLevel}
              </span>
            </button>
          ))}
        </div>
      ) : null}
      {open && !loading && q.trim().length >= 2 && results.length === 0 ? (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-navy-200 bg-white px-3 py-2 text-sm text-navy-500 shadow-xl">
          Aucune personne trouvée.
        </div>
      ) : null}
    </div>
  );
}
