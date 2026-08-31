import Link from "next/link";
import { AGENCY } from "@/lib/constants";
import { Emblem } from "@/components/brand/emblem";

const COLS = [
  {
    title: "Most Wanted",
    links: [
      { href: "/most-wanted", label: "Ten Most Wanted" },
      { href: "/most-wanted?category=FUGITIVE", label: "Fugitifs" },
      { href: "/most-wanted?category=SEEKING_INFORMATION", label: "Seeking Information" },
      { href: "/most-wanted?category=MISSING_PERSON", label: "Personnes disparues" },
    ],
  },
  {
    title: "Enquêtes",
    links: [
      { href: "/investigations", label: "Enquêtes criminelles" },
      { href: "/investigations?topic=cyber", label: "Cybercriminalité" },
      { href: "/investigations?topic=organized", label: "Crime organisé" },
      { href: "/investigations?topic=financial", label: "Criminalité financière" },
    ],
  },
  {
    title: "À propos",
    links: [
      { href: "/about", label: "Mission" },
      { href: "/about#leadership", label: "Direction" },
      { href: "/about#history", label: "Histoire" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Carrières",
    links: [
      { href: "/apply", label: "Candidater" },
      { href: "/careers#benefits", label: "Avantages" },
      { href: "/careers", label: "Postes ouverts" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-navy-200 bg-navy-950 text-navy-200">
      <div className="container-fia grid gap-8 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2 text-white">
            <Emblem size={30} />
            <span className="text-lg font-bold">{AGENCY.abbr}</span>
          </div>
          <p className="mt-3 text-sm text-navy-400">{AGENCY.name}</p>
          <p className="mt-1 text-xs text-navy-500">{AGENCY.division}</p>
        </div>
        {COLS.map((col) => (
          <div key={col.title}>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-white">
              {col.title}
            </h4>
            <ul className="mt-3 space-y-2 text-sm">
              {col.links.map((l) => (
                <li key={l.href + l.label}>
                  <Link href={l.href} className="text-navy-300 hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-navy-800">
        <div className="container-fia flex flex-col items-center justify-between gap-2 py-6 text-xs text-navy-400 sm:flex-row">
          <p>
            <span className="font-semibold text-navy-200">{AGENCY.name}</span> —{" "}
            {AGENCY.baseline}
          </p>
          <p>© {new Date().getFullYear()} {AGENCY.name}. Agence fictive pour serveur GTA RP.</p>
        </div>
      </div>
    </footer>
  );
}
