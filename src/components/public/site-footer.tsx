import Link from "next/link";
import { Shield } from "lucide-react";
import { AGENCY } from "@/lib/constants";

const COLS = [
  {
    title: "Most Wanted",
    links: [
      { href: "/most-wanted", label: "Ten Most Wanted" },
      { href: "/most-wanted?category=FUGITIVE", label: "Fugitives" },
      { href: "/most-wanted?category=SEEKING_INFORMATION", label: "Seeking Information" },
      { href: "/most-wanted?category=MISSING_PERSON", label: "Missing Persons" },
    ],
  },
  {
    title: "Investigations",
    links: [
      { href: "/investigations", label: "Criminal Investigations" },
      { href: "/investigations?topic=cyber", label: "Cybercrime" },
      { href: "/investigations?topic=organized", label: "Organized Crime" },
      { href: "/investigations?topic=financial", label: "Financial Crimes" },
    ],
  },
  {
    title: "About",
    links: [
      { href: "/about", label: "Mission" },
      { href: "/about#leadership", label: "Leadership" },
      { href: "/about#history", label: "History" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Careers",
    links: [
      { href: "/apply", label: "Apply" },
      { href: "/careers#benefits", label: "Benefits" },
      { href: "/careers", label: "Open Positions" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-navy-200 bg-navy-950 text-navy-200">
      <div className="container-fia grid gap-8 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2 text-white">
            <Shield className="h-6 w-6" />
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
          <p>© {new Date().getFullYear()} {AGENCY.name}. This is a fictional agency for GTA RP.</p>
        </div>
      </div>
    </footer>
  );
}
