"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm";

export function SecuritySettings({ twoFactorEnabled }: { twoFactorEnabled: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const [enroll, setEnroll] = useState<{ secret: string; uri: string } | null>(null);

  async function begin2fa() {
    const r = await fetch("/api/auth/2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "begin" }),
    });
    const j = await r.json();
    if (!r.ok) return toast("error", j.error ?? "Échec.");
    setEnroll(j.data);
  }

  async function enable2fa(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = new FormData(e.currentTarget).get("code");
    const r = await fetch("/api/auth/2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "enable", code }),
    });
    const j = await r.json();
    if (!r.ok) return toast("error", j.error ?? "Code incorrect.");
    toast("success", "Double authentification activée.");
    setEnroll(null);
    router.refresh();
  }

  async function disable2fa(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const r = await fetch("/api/auth/2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "disable",
        password: fd.get("password"),
        code: fd.get("code"),
      }),
    });
    const j = await r.json();
    if (!r.ok) return toast("error", j.error ?? "Échec.");
    toast("success", "Double authentification désactivée.");
    router.refresh();
  }

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (fd.get("newPassword") !== fd.get("confirmPassword")) {
      return toast("error", "Les deux nouveaux mots de passe ne correspondent pas.");
    }
    setBusy(true);
    const r = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: fd.get("currentPassword"),
        newPassword: fd.get("newPassword"),
      }),
    });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) return toast("error", j.error ?? "Échec du changement de mot de passe.");
    (e.target as HTMLFormElement).reset();
    toast("success", "Mot de passe changé. Vos autres sessions ont été déconnectées.");
  }

  async function logoutEverywhere() {
    const ok = await confirm({
      title: "Se déconnecter de tous les appareils ?",
      message:
        "Toutes vos sessions actives (y compris celle-ci) seront immédiatement invalidées. Vous devrez vous reconnecter.",
      confirmLabel: "Déconnecter partout",
      danger: true,
    });
    if (!ok) return;
    await fetch("/api/auth/logout-all", { method: "POST" });
    router.push("/agent/login");
  }

  return (
    <div className="space-y-6">
      <form onSubmit={changePassword} className="grid gap-3 sm:grid-cols-2">
        <Field label="Mot de passe actuel" className="sm:col-span-2" required>
          <Input name="currentPassword" type="password" required autoComplete="current-password" />
        </Field>
        <Field label="Nouveau mot de passe" required>
          <Input
            name="newPassword"
            type="password"
            required
            minLength={10}
            autoComplete="new-password"
          />
        </Field>
        <Field label="Confirmer le nouveau mot de passe" required>
          <Input name="confirmPassword" type="password" required minLength={10} autoComplete="new-password" />
        </Field>
        <div className="sm:col-span-2">
          <Button size="sm" type="submit" disabled={busy}>
            {busy ? "Enregistrement…" : "Changer le mot de passe"}
          </Button>
        </div>
      </form>

      <div className="border-t border-navy-100 pt-4">
        <p className="mb-1 text-sm font-semibold text-navy-800">Double authentification (TOTP)</p>
        {twoFactorEnabled ? (
          <>
            <p className="mb-2 text-sm text-emerald-700">Active. Un code est demandé à chaque connexion.</p>
            <form onSubmit={disable2fa} className="flex flex-wrap items-end gap-2">
              <Field label="Mot de passe">
                <Input name="password" type="password" required autoComplete="current-password" />
              </Field>
              <Field label="Code actuel">
                <Input name="code" inputMode="numeric" maxLength={6} required placeholder="123456" />
              </Field>
              <Button variant="danger" size="sm" type="submit">
                Désactiver
              </Button>
            </form>
          </>
        ) : enroll ? (
          <div className="space-y-2">
            <p className="text-sm text-navy-600">
              Ajoutez cette clé à votre application d&apos;authentification (Google Authenticator,
              Aegis, 1Password…) :
            </p>
            <code className="block break-all rounded bg-navy-100 px-2 py-1 font-mono text-xs">
              {enroll.secret}
            </code>
            <p className="text-xs text-navy-400 break-all">{enroll.uri}</p>
            <form onSubmit={enable2fa} className="flex items-end gap-2">
              <Field label="Code généré">
                <Input name="code" inputMode="numeric" maxLength={6} required placeholder="123456" />
              </Field>
              <Button size="sm" type="submit">
                Activer
              </Button>
            </form>
          </div>
        ) : (
          <>
            <p className="mb-2 text-sm text-navy-600">
              Recommandé, surtout pour les comptes à privilèges élevés.
            </p>
            <Button size="sm" variant="secondary" onClick={begin2fa}>
              Configurer la double authentification
            </Button>
          </>
        )}
      </div>

      <div className="border-t border-navy-100 pt-4">
        <p className="mb-2 text-sm text-navy-600">
          Si vous pensez qu&apos;une de vos sessions a été compromise, révoquez-les toutes.
        </p>
        <Button variant="danger" size="sm" onClick={logoutEverywhere}>
          Se déconnecter de tous les appareils
        </Button>
      </div>
    </div>
  );
}
