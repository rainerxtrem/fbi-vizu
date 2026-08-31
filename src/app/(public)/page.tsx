import Link from "next/link";
import { ArrowRight, Shield, Scale, Users, FileSearch, Phone } from "lucide-react";
import { prisma } from "@/lib/db";
import { ButtonLink } from "@/components/ui/button";
import { MostWantedCard } from "@/components/public/most-wanted-card";
import { formatDate } from "@/lib/format";
import { NEWS_CATEGORY } from "@/lib/constants";

const HERO_IMG =
  "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&w=2000&q=70";

export default async function HomePage() {
  const [mostWanted, news, stats] = await Promise.all([
    prisma.mostWanted.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ dangerLevel: "desc" }, { reward: "desc" }],
      take: 4,
    }),
    prisma.news.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
    Promise.all([
      prisma.mostWanted.count({ where: { status: "PUBLISHED" } }),
      prisma.investigation.count(),
      prisma.investigation.count({ where: { status: { in: ["OPEN", "ACTIVE"] } } }),
    ]),
  ]);

  const [wantedCount, caseCount, activeCount] = stats;

  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-navy-950 text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HERO_IMG}
          alt="Silhouette de San Andreas au crépuscule"
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-950 via-navy-950/80 to-navy-950/30" />
        <div className="container-fia py-24 sm:py-32">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-navy-300">
            Federal Bureau of Investigation
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-bold leading-[1.05] sm:text-6xl">
            LA MISSION D'ABORD
          </h1>
          <p className="mt-4 max-w-xl text-lg text-navy-200">
            Protéger San Andreas. Poursuivre la justice.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/most-wanted" size="lg">
              Voir les Most Wanted <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="/apply" size="lg" variant="outline">
              Candidater
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* STATS RAPIDES */}
      <section className="border-b border-navy-200 bg-navy-50">
        <div className="container-fia grid grid-cols-2 divide-navy-200 py-8 sm:grid-cols-4 sm:divide-x">
          {[
            { n: wantedCount, l: "Most Wanted publiés" },
            { n: caseCount, l: "Enquêtes enregistrées" },
            { n: activeCount, l: "Enquêtes actives" },
            { n: "24/7", l: "Ligne de renseignement" },
          ].map((s, i) => (
            <div key={i} className="px-4 py-2 text-center">
              <p className="text-3xl font-bold text-navy-900">{s.n}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-navy-500">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MOST WANTED */}
      <section className="container-fia py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold">MOST WANTED</h2>
            <p className="mt-1 max-w-xl text-navy-600">
              Aidez-nous à localiser des individus recherchés pour des infractions
              fédérales graves.
            </p>
          </div>
          <Link
            href="/most-wanted"
            className="inline-flex items-center gap-1 text-sm font-semibold uppercase text-navy-700 hover:text-federal-accent"
          >
            Voir tout <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {mostWanted.length === 0 ? (
          <p className="mt-8 text-navy-500">Aucun individu n'est actuellement publié.</p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {mostWanted.map((mw) => (
              <MostWantedCard key={mw.id} mw={mw} />
            ))}
          </div>
        )}
      </section>

      {/* MISSION / AIDE */}
      <section className="bg-navy-900 text-white">
        <div className="container-fia grid gap-10 py-16 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold text-white">Notre mission</h2>
            <p className="mt-4 text-navy-200">
              Le Federal Bureau of Investigation est le principal service fédéral
              de police judiciaire et de renseignement intérieur de l'État de San
              Andreas. Nous enquêtons sur les menaces les plus complexes qui
              pèsent sur nos communautés — des entreprises criminelles organisées
              et des fugitifs violents aux intrusions informatiques, à la
              corruption publique et au terrorisme.
            </p>
            <p className="mt-4 text-navy-200">
              Nous intervenons dans toutes les juridictions de l'État, en
              partenariat avec les services locaux, de comté et fédéraux, afin de
              traduire les auteurs en justice.
            </p>
            <ButtonLink href="/about" variant="outline" className="mt-6">
              À propos du FBI
            </ButtonLink>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: Shield, t: "Signaler un crime", d: "Contactez votre Field Office le plus proche ou soumettez un renseignement en ligne.", href: "/submit-tip" },
              { icon: FileSearch, t: "Suivre les enquêtes", d: "Consultez les mises à jour publiques et les communiqués de presse.", href: "/investigations" },
              { icon: Users, t: "Rejoindre le FBI", d: "Découvrez les carrières de Special Agent et d'analyste.", href: "/apply" },
              { icon: Scale, t: "Aide aux victimes", d: "Découvrez comment nous accompagnons les victimes de crimes fédéraux.", href: "/how-we-can-help" },
            ].map((c, i) => (
              <Link
                key={i}
                href={c.href}
                className="rounded-lg border border-navy-700 bg-navy-800/60 p-5 hover:border-navy-500"
              >
                <c.icon className="h-6 w-6 text-navy-300" />
                <h3 className="mt-3 text-sm font-semibold text-white">{c.t}</h3>
                <p className="mt-1 text-sm text-navy-300">{c.d}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ACTUALITÉS */}
      <section className="container-fia py-16">
        <div className="flex items-end justify-between">
          <h2 className="text-3xl font-bold">Dernières actualités</h2>
          <Link
            href="/news"
            className="inline-flex items-center gap-1 text-sm font-semibold uppercase text-navy-700 hover:text-federal-accent"
          >
            Salle de presse <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {news.length === 0 ? (
          <p className="mt-8 text-navy-500">Aucune actualité pour le moment.</p>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {news.map((a) => (
              <Link
                key={a.id}
                href={`/news/${a.slug}`}
                className="group flex flex-col overflow-hidden rounded-lg border border-navy-200 bg-white"
              >
                <div className="aspect-[16/9] overflow-hidden bg-navy-100">
                  {a.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.imageUrl}
                      alt=""
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-federal-accent">
                    {NEWS_CATEGORY[a.category]}
                  </p>
                  <h3 className="mt-1 font-semibold leading-snug text-navy-900 group-hover:text-federal-accent">
                    {a.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm text-navy-600">{a.subtitle}</p>
                  <p className="mt-auto pt-3 text-xs text-navy-400">
                    {formatDate(a.publishedAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* CTA RENSEIGNEMENT */}
      <section className="bg-federal-accent">
        <div className="container-fia flex flex-col items-center justify-between gap-4 py-10 text-center text-white sm:flex-row sm:text-left">
          <div className="flex items-center gap-4">
            <Phone className="h-8 w-8" />
            <div>
              <h2 className="text-xl font-bold text-white">Vous avez des informations sur un crime ?</h2>
              <p className="text-red-100">
                Votre renseignement pourrait être celui qui résout une affaire. Les signalements peuvent être anonymes.
              </p>
            </div>
          </div>
          <ButtonLink href="/submit-tip" variant="secondary" size="lg">
            Submit a Tip
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
