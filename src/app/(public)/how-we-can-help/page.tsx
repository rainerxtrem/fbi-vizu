import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/public/page-header";

export const metadata: Metadata = { title: "Comment nous pouvons vous aider" };

const SERVICES = [
  {
    t: "Signaler un crime",
    d: "Transmettez des informations sur une activité criminelle, une menace ou un individu recherché via notre système de renseignement en ligne ou votre Field Office le plus proche.",
    href: "/submit-tip",
  },
  {
    t: "Aide aux victimes",
    d: "Le bureau d'aide aux victimes du FBI veille à ce que les victimes de crimes fédéraux soient traitées avec équité, dignité et respect tout au long de la procédure d'enquête.",
    href: "/contact",
  },
  {
    t: "Seeking Information",
    d: "Consultez les affaires pour lesquelles le FBI sollicite l'aide du public afin d'identifier des suspects, localiser des personnes disparues ou recueillir des preuves.",
    href: "/most-wanted?category=SEEKING_INFORMATION",
  },
  {
    t: "Personnes disparues",
    d: "Accédez aux bulletins de personnes disparues du FBI et transmettez des informations susceptibles d'aider à retrouver quelqu'un.",
    href: "/most-wanted?category=MISSING_PERSON",
  },
  {
    t: "Pour les partenaires des forces de l'ordre",
    d: "Le FBI coordonne des groupes d'intervention et partage du renseignement avec les services locaux, de comté et de l'État à travers San Andreas.",
    href: "/about",
  },
  {
    t: "Presse et médias",
    d: "Les membres de la presse peuvent consulter les déclarations officielles, les mises à jour d'enquête et les avis au public dans la salle de presse du FBI.",
    href: "/news",
  },
];

export default function HowWeCanHelpPage() {
  return (
    <div>
      <PageHeader
        title="Comment nous pouvons vous aider"
        intro="Le FBI est au service de la population de San Andreas. Trouvez la ressource dont vous avez besoin ci-dessous."
        crumbs={[{ label: "Accueil", href: "/" }, { label: "Comment nous pouvons vous aider" }]}
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
