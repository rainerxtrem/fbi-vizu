import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Shield } from "lucide-react";
import { getActor } from "@/lib/auth";
import { LoginForm } from "./login-form";
import { AGENCY } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Espace Agent", robots: { index: false } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const actor = await getActor();
  if (actor && (actor.agent || actor.isAdmin)) redirect("/agent");

  return (
    <div className="flex min-h-screen">
      <div className="hidden flex-1 flex-col justify-between bg-navy-950 p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8" />
          <div>
            <p className="text-lg font-bold">{AGENCY.abbr}</p>
            <p className="text-xs uppercase tracking-widest text-navy-400">
              {AGENCY.name}
            </p>
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold">Portail d&apos;enquête</h1>
          <p className="mt-3 max-w-sm text-navy-300">
            Réservé au personnel autorisé. Toute activité sur ce système est
            surveillée et enregistrée. Tout accès non autorisé constitue une
            infraction fédérale.
          </p>
        </div>
        <p className="text-xs text-navy-500">{AGENCY.baseline}</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-white p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Shield className="h-8 w-8 text-navy-900" />
          </div>
          <h2 className="text-2xl font-bold text-navy-900">Connexion Agent</h2>
          <p className="mt-1 text-sm text-navy-500">
            Accédez à la console d&apos;enquête du FBI.
          </p>
          {searchParams.error === "not_an_agent" ? (
            <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Ce compte n&apos;a pas accès à la console.
            </p>
          ) : null}
          <div className="mt-6">
            <LoginForm />
          </div>
          <p className="mt-6 text-xs text-navy-400">
            Vous n&apos;êtes pas Agent ?{" "}
            <Link href="/" className="link-underline">
              Retour au site public
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
