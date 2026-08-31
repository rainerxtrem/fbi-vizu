import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertTriangle, Shield } from "lucide-react";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/misc";
import { TipForm } from "@/components/public/tip-form";
import { formatDate, formatMoney } from "@/lib/format";
import {
  DANGER_LEVEL,
  MOST_WANTED_CATEGORY,
  MOST_WANTED_STATUS,
} from "@/lib/constants";

async function load(id: string) {
  return prisma.mostWanted.findFirst({
    where: {
      id,
      status: { in: ["PUBLISHED", "CAPTURED", "LOCATED", "ARCHIVED"] },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const mw = await load(params.id);
  if (!mw) return { title: "Dossier introuvable" };
  return {
    title: `${mw.fullName} — Most Wanted`,
    description: mw.description.slice(0, 155),
  };
}

export default async function MostWantedDetail({
  params,
}: {
  params: { id: string };
}) {
  const mw = await load(params.id);
  if (!mw) notFound();

  const captured = mw.status === "CAPTURED" || mw.status === "LOCATED";

  return (
    <div>
      <div className="bg-navy-900 text-white">
        <div className="container-fia py-10">
          <Breadcrumbs
            items={[
              { label: "Accueil", href: "/" },
              { label: "Most Wanted", href: "/most-wanted" },
              { label: mw.fullName },
            ]}
          />
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.25em] text-federal-accent">
            Most Wanted
          </p>
          <h1 className="mt-1 text-4xl font-bold">{mw.fullName}</h1>
        </div>
      </div>

      <div className="container-fia grid gap-10 py-10 lg:grid-cols-[340px_1fr]">
        {/* IDENTITÉ */}
        <div>
          <div className="overflow-hidden rounded-lg border border-navy-200 bg-navy-100">
            {mw.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mw.photoUrl}
                alt={mw.fullName}
                className="aspect-[4/5] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[4/5] items-center justify-center text-navy-400">
                Aucune photographie disponible
              </div>
            )}
          </div>

          <dl className="mt-4 divide-y divide-navy-100 rounded-lg border border-navy-200 text-sm">
            <Row label="Statut">
              <Badge tone={captured ? "green" : "red"}>
                {mw.status === "CAPTURED"
                  ? "Captured"
                  : mw.status === "LOCATED"
                    ? "Localisé"
                    : "At Large"}
              </Badge>
            </Row>
            <Row label="Niveau de dangerosité">
              <Badge tone={DANGER_LEVEL[mw.dangerLevel]?.tone ?? "amber"}>
                {DANGER_LEVEL[mw.dangerLevel]?.label ?? mw.dangerLevel}
              </Badge>
            </Row>
            <Row label="Récompense">
              <span className="font-bold">
                {mw.reward > 0 ? `Jusqu'à ${formatMoney(mw.reward)}` : "—"}
              </span>
            </Row>
            <Row label="Catégorie">
              {MOST_WANTED_CATEGORY[mw.category] ?? mw.category}
            </Row>
            {mw.aliases ? <Row label="Alias">{mw.aliases}</Row> : null}
            {mw.age ? <Row label="Âge">{mw.age} ans</Row> : null}
          </dl>

          <div className="mt-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Doit être considéré comme présentant un risque{" "}
              {(DANGER_LEVEL[mw.dangerLevel]?.label ?? "").toLowerCase()}. N'essayez
              pas d'appréhender cet individu. Contactez immédiatement le FBI ou les
              forces de l'ordre locales.
            </p>
          </div>
        </div>

        {/* DÉTAIL */}
        <div className="space-y-10">
          <Section title="Description">
            <p className="prose-fia whitespace-pre-line">{mw.description}</p>
          </Section>

          <Section title="Chefs d'accusation">
            {mw.charges.length ? (
              <ul className="list-disc space-y-1 pl-5 text-navy-800">
                {mw.charges.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            ) : (
              <p className="text-navy-500">Chefs d'accusation en attente.</p>
            )}
          </Section>

          <Section title="Dernières informations connues">
            <dl className="grid gap-3 sm:grid-cols-2">
              <Info label="Dernière localisation connue" value={mw.lastKnownLocation} />
              <Info label="Véhicule" value={mw.vehicle} />
              <Info label="Complices" value={mw.associates} />
              <Info label="Organisations connues" value={mw.knownOrganizations} />
              <Info
                label="Date de dernière observation"
                value={mw.dateLastSeen ? formatDate(mw.dateLastSeen) : null}
              />
            </dl>
          </Section>

          <Section title="Informations sur le dossier">
            <dl className="grid gap-3 sm:grid-cols-2">
              <Info label="Case Number" value={mw.caseNumber ?? mw.publicId} mono />
              <Info label="Agence responsable" value={mw.leadAgency} />
              <Info label="Agent responsable" value={mw.leadAgent} />
              <Info
                label="Ouvert le"
                value={mw.openedDate ? formatDate(mw.openedDate) : null}
              />
              <Info
                label="Publié le"
                value={mw.publishedAt ? formatDate(mw.publishedAt) : null}
              />
              <Info label="Statut" value={MOST_WANTED_STATUS[mw.status]?.label} />
            </dl>
          </Section>

          {/* RENSEIGNEMENT PUBLIC */}
          <div className="rounded-lg border border-navy-200 bg-navy-50 p-6" id="tip">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-navy-700" />
              <h2 className="text-lg font-bold">Vous avez des informations ?</h2>
            </div>
            <p className="mt-1 text-sm text-navy-600">
              Si vous détenez des informations concernant cet individu, soumettez
              un renseignement au FBI. Vous pouvez le faire de manière anonyme.
            </p>
            <div className="mt-5">
              <TipForm mostWantedId={mw.id} compact />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <dt className="text-xs uppercase tracking-wide text-navy-500">{label}</dt>
      <dd className="text-navy-900">{children}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="border-b-2 border-navy-900 pb-1 text-lg font-bold uppercase tracking-wide">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Info({
  label,
  value,
  mono,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-navy-500">{label}</dt>
      <dd className={mono ? "font-mono text-navy-900" : "text-navy-900"}>
        {value || "—"}
      </dd>
    </div>
  );
}
