import "server-only";
import { log } from "./log";

/**
 * Transactional email via Resend's HTTP API (no SDK dependency). If
 * RESEND_API_KEY / EMAIL_FROM are not configured the calls are no-ops that log
 * — the app works fine without email, it just doesn't send any.
 */

const KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM;
export const EMAIL_ENABLED = Boolean(KEY && FROM);

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function shell(title: string, bodyHtml: string): string {
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f2f3f6;font-family:Arial,Helvetica,sans-serif;color:#16203a">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <p style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#a5331f;font-weight:bold;margin:0 0 16px">
      Federal Bureau of Investigation
    </p>
    <div style="background:#fff;border:1px solid #d8dbe3;border-radius:8px;padding:24px">
      <h1 style="font-size:18px;margin:0 0 12px">${title}</h1>
      ${bodyHtml}
    </div>
    <p style="font-size:11px;color:#8a94a6;margin-top:16px">
      Message automatique du portail FBI. Merci de ne pas répondre.
    </p>
  </div></body></html>`;
}

export async function sendEmail(to: string, subject: string, title: string, bodyHtml: string) {
  const html = shell(title, bodyHtml);
  if (!EMAIL_ENABLED) {
    log.info("email.skipped", { to, subject });
    return { sent: false };
  }
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to, subject, html, text: stripHtml(html) }),
    });
    if (!r.ok) {
      log.warn("email.failed", { to, subject, status: r.status });
      return { sent: false };
    }
    return { sent: true };
  } catch (err) {
    log.warn("email.error", { to, subject }, err);
    return { sent: false };
  }
}

// --- templates -----------------------------------------------------------

export function agentWelcomeEmail(name: string, badge: string, tempPassword: string | null) {
  const pw = tempPassword
    ? `<p>Mot de passe temporaire : <code style="background:#eaecf1;padding:2px 6px;border-radius:3px">${tempPassword}</code></p>
       <p style="font-size:13px;color:#4b5568">Changez-le à votre première connexion (Paramètres &gt; Sécurité).</p>`
    : `<p>Utilisez le mot de passe qui vous a été communiqué.</p>`;
  return {
    subject: `Votre accès à la console FBI — matricule ${badge}`,
    title: `Bienvenue, ${name}`,
    body: `<p>Votre compte agent a été créé. Matricule : <strong>${badge}</strong>.</p>${pw}`,
  };
}

export function applicationStatusEmail(firstName: string, publicId: string, statusLabel: string) {
  return {
    subject: `Candidature ${publicId} — ${statusLabel}`,
    title: `Mise à jour de votre candidature`,
    body: `<p>Bonjour ${firstName},</p><p>Le statut de votre candidature <strong>${publicId}</strong> est désormais : <strong>${statusLabel}</strong>.</p>`,
  };
}

export function tipReceiptEmail(publicId: string) {
  return {
    subject: `Renseignement reçu — ${publicId}`,
    title: `Merci pour votre signalement`,
    body: `<p>Votre renseignement a bien été reçu sous la référence <strong>${publicId}</strong>. Nos équipes l'examineront. Ne divulguez cette référence à personne.</p>`,
  };
}
