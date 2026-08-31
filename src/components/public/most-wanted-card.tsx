import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/format";
import { DANGER_LEVEL, MOST_WANTED_CATEGORY } from "@/lib/constants";

export interface MostWantedCardData {
  id: string;
  publicId: string;
  fullName: string;
  aliases: string | null;
  age: number | null;
  photoUrl: string | null;
  charges: string[];
  reward: number;
  category: string;
  dangerLevel: string;
  status: string;
  lastKnownLocation: string | null;
}

export function MostWantedCard({ mw }: { mw: MostWantedCardData }) {
  const captured = mw.status === "CAPTURED" || mw.status === "LOCATED";
  return (
    <Link
      href={`/most-wanted/${mw.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-navy-200 bg-white shadow-sm transition hover:border-navy-400 hover:shadow-md"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-navy-100">
        {mw.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mw.photoUrl}
            alt={mw.fullName}
            className="h-full w-full object-cover grayscale-[20%] transition group-hover:grayscale-0"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-navy-300">
            Aucune photographie
          </div>
        )}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          <Badge tone={captured ? "green" : "red"}>
            {mw.status === "CAPTURED"
              ? "Captured"
              : mw.status === "LOCATED"
                ? "Localisé"
                : "At Large"}
          </Badge>
        </div>
        <div className="absolute right-2 top-2">
          <Badge tone={DANGER_LEVEL[mw.dangerLevel]?.tone ?? "amber"}>
            Risque {DANGER_LEVEL[mw.dangerLevel]?.label ?? mw.dangerLevel}
          </Badge>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-federal-accent">
          {MOST_WANTED_CATEGORY[mw.category] ?? "Most Wanted"}
        </p>
        <h3 className="mt-1 text-base font-bold leading-snug text-navy-900">
          {mw.fullName}
        </h3>
        {mw.aliases ? (
          <p className="text-xs text-navy-500">Alias : {mw.aliases}</p>
        ) : null}
        <p className="mt-2 text-xs text-navy-500">
          {mw.age ? `${mw.age} ans · ` : ""}
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {mw.lastKnownLocation ?? "Inconnue"}
          </span>
        </p>
        <div className="mt-3 line-clamp-2 text-sm text-navy-700">
          Recherché pour : {mw.charges.slice(0, 3).join(", ") || "infractions fédérales"}
        </div>
        <div className="mt-auto flex items-center justify-between pt-4">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-navy-400">Récompense</p>
            <p className="text-sm font-bold text-navy-900">
              {mw.reward > 0 ? `Jusqu'à ${formatMoney(mw.reward)}` : "—"}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase text-navy-700 group-hover:text-federal-accent">
            Voir le dossier <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
