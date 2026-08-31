"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { AGENCY } from "@/lib/constants";
import { Emblem } from "@/components/brand/emblem";

const NAV = [
  { href: "/most-wanted", label: "Most Wanted" },
  { href: "/investigations", label: "Enquêtes" },
  { href: "/news", label: "Actualités" },
  { href: "/how-we-can-help", label: "Comment nous pouvons vous aider" },
  { href: "/careers", label: "Carrières" },
  { href: "/about", label: "À propos" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
    setSearchOpen(false);
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-navy-200 bg-white">
      <div className="h-1 gov-band" />
      <div className="bg-navy-900 text-white">
        <div className="container-fia flex h-9 items-center justify-between text-xs">
          <span className="hidden sm:block">
            Un portail officiel de la {AGENCY.division}
          </span>
          <div className="flex items-center gap-4">
            <Link href="/submit-tip" className="hover:text-navy-200">
              Submit a Tip
            </Link>
            <Link href="/contact" className="hover:text-navy-200">
              Contact
            </Link>
            <Link href="/agent/login" className="font-semibold hover:text-navy-200">
              Espace Agent
            </Link>
          </div>
        </div>
      </div>

      <div className="container-fia flex h-20 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <Emblem size={46} />
          <span className="leading-tight">
            <span className="block text-lg font-bold tracking-tight text-navy-900">
              {AGENCY.abbr}
            </span>
            <span className="block text-[11px] font-medium uppercase tracking-widest text-navy-500">
              {AGENCY.name}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "text-sm font-semibold text-navy-700 hover:text-federal-accent",
                pathname.startsWith(n.href) && "text-federal-accent",
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            aria-label="Rechercher"
            onClick={() => setSearchOpen((s) => !s)}
            className="flex h-10 w-10 items-center justify-center rounded-md text-navy-700 hover:bg-navy-100"
          >
            <Search className="h-5 w-5" />
          </button>
          <Link
            href="/apply"
            className="hidden rounded-md bg-federal-accent px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white hover:bg-red-800 sm:inline-block"
          >
            Apply
          </Link>
          <button
            aria-label="Menu"
            onClick={() => setOpen((s) => !s)}
            className="flex h-10 w-10 items-center justify-center rounded-md text-navy-700 hover:bg-navy-100 lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {searchOpen ? (
        <div className="border-t border-navy-200 bg-navy-50">
          <form onSubmit={submitSearch} className="container-fia flex gap-2 py-3">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher sur FBI.gov — Most Wanted, actualités, dossiers…"
              className="field-input"
            />
            <button className="rounded-md bg-navy-800 px-4 text-sm font-semibold uppercase text-white">
              Rechercher
            </button>
          </form>
        </div>
      ) : null}

      {open ? (
        <div className="border-t border-navy-200 bg-white lg:hidden">
          <nav className="container-fia flex flex-col py-2">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="border-b border-navy-100 py-3 text-sm font-semibold text-navy-800"
              >
                {n.label}
              </Link>
            ))}
            <Link
              href="/apply"
              onClick={() => setOpen(false)}
              className="mt-3 rounded-md bg-federal-accent px-4 py-2 text-center text-sm font-semibold uppercase text-white"
            >
              Candidater
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
