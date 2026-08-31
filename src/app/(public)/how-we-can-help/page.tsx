import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/public/page-header";

export const metadata: Metadata = { title: "How We Can Help" };

const SERVICES = [
  {
    t: "Report a Crime",
    d: "Submit information about criminal activity, threats, or wanted individuals through our online tip system or your nearest field office.",
    href: "/submit-tip",
  },
  {
    t: "Victim Services",
    d: "The FIA Office for Victim Assistance ensures that victims of federal crime are treated with fairness, dignity, and respect throughout the investigative process.",
    href: "/contact",
  },
  {
    t: "Seeking Information",
    d: "Review cases where the FIA is seeking the public's help identifying suspects, locating missing persons, or gathering evidence.",
    href: "/most-wanted?category=SEEKING_INFORMATION",
  },
  {
    t: "Missing Persons",
    d: "Access FIA missing-person bulletins and submit information that may help bring someone home.",
    href: "/most-wanted?category=MISSING_PERSON",
  },
  {
    t: "For Law Enforcement Partners",
    d: "The FIA coordinates task forces and shares intelligence with local, county, and state agencies across San Andreas.",
    href: "/about",
  },
  {
    t: "Press & Media",
    d: "Members of the press can find official statements, case updates, and public notices in the FIA Newsroom.",
    href: "/news",
  },
];

export default function HowWeCanHelpPage() {
  return (
    <div>
      <PageHeader
        title="How We Can Help"
        intro="The FIA serves the people of San Andreas. Find the resource you need below."
        crumbs={[{ label: "Home", href: "/" }, { label: "How We Can Help" }]}
      />
      <div className="container-fia grid gap-5 py-12 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((s) => (
          <Link
            key={s.t}
            href={s.href}
            className="rounded-lg border border-navy-200 bg-white p-5 hover:border-navy-400"
          >
            <h3 className="font-semibold text-navy-900">{s.t}</h3>
            <p className="mt-2 text-sm text-navy-600">{s.d}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
