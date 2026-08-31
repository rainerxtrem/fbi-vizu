import type { Metadata } from "next";
import { Phone, Mail, MapPin } from "lucide-react";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/public/page-header";
import { AGENCY } from "@/lib/constants";

export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage() {
  const offices = await prisma.fieldOffice.findMany({ orderBy: { isHq: "desc" } });

  return (
    <div>
      <PageHeader
        title="Contacter le FBI"
        intro={`${AGENCY.name} — ${AGENCY.division}`}
        crumbs={[{ label: "Accueil", href: "/" }, { label: "Contact" }]}
      />
      <div className="container-fia grid gap-10 py-12 lg:grid-cols-[1fr_1fr]">
        <div>
          <h2 className="text-xl font-bold">Field Offices</h2>
          <div className="mt-4 space-y-4">
            {offices.map((o) => (
              <div key={o.id} className="rounded-lg border border-navy-200 bg-white p-5">
                <p className="font-semibold text-navy-900">
                  {o.name} {o.isHq ? "· Quartier général de division" : ""}
                </p>
                <p className="mt-2 flex items-center gap-2 text-sm text-navy-600">
                  <MapPin className="h-4 w-4" /> {o.address}
                </p>
                <p className="flex items-center gap-2 text-sm text-navy-600">
                  <Phone className="h-4 w-4" /> {o.phone}
                </p>
                <p className="flex items-center gap-2 text-sm text-navy-600">
                  <Mail className="h-4 w-4" /> {o.email}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold">Localisation</h2>
          <div className="mt-4 overflow-hidden rounded-lg border border-navy-200">
            <iframe
              title="Carte de San Andreas"
              className="h-[420px] w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src="https://www.openstreetmap.org/export/embed.html?bbox=-118.70%2C33.60%2C-118.00%2C34.20&layer=mapnik"
            />
          </div>
          <p className="mt-3 text-xs text-navy-400">
            San Andreas est un État fictif. Carte affichée à titre indicatif.
          </p>
        </div>
      </div>
    </div>
  );
}
