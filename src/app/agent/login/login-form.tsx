"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsTotp, setNeedsTotp] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: fd.get("email"),
        password: fd.get("password"),
        totpCode: fd.get("totpCode") || undefined,
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      if (json.needsTotp) setNeedsTotp(true);
      setError(json.error ?? "Échec de la connexion.");
      return;
    }
    router.push("/agent");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <Field label="Adresse e-mail" htmlFor="email">
        <Input id="email" name="email" type="email" required autoComplete="username" autoFocus />
      </Field>
      <Field label="Mot de passe" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </Field>
      {needsTotp ? (
        <Field label="Code de vérification (application d'authentification)" htmlFor="totpCode">
          <Input
            id="totpCode"
            name="totpCode"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            autoFocus
          />
        </Field>
      ) : null}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Connexion…" : needsTotp ? "Vérifier et se connecter" : "Se connecter"}
      </Button>
    </form>
  );
}
