import "server-only";
import crypto from "crypto";

/**
 * RFC 6238 TOTP (SHA-1, 6 digits, 30s step) with no external dependency.
 * Secrets are stored/handled as base32.
 */

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function generateSecret(bytes = 20): string {
  const buf = crypto.randomBytes(bytes);
  let bits = "";
  for (const b of buf) bits += b.toString(2).padStart(8, "0");
  let out = "";
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    out += B32[parseInt(bits.slice(i, i + 5), 2)];
  }
  return out;
}

function base32Decode(s: string): Buffer {
  const clean = s.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = "";
  for (const c of clean) {
    const v = B32.indexOf(c);
    if (v < 0) continue;
    bits += v.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function hotp(secret: Buffer, counter: number): string {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac("sha1", secret).update(buf).digest();
  const offset = hmac[hmac.length - 1]! & 0xf;
  const bin =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff);
  return (bin % 1_000_000).toString().padStart(6, "0");
}

/** Verify a 6-digit code against the secret, allowing ±1 time step of drift. */
export function verifyTotp(secretB32: string, code: string): boolean {
  const clean = (code ?? "").replace(/\D/g, "");
  if (clean.length !== 6) return false;
  const secret = base32Decode(secretB32);
  const step = Math.floor(Date.now() / 30_000);
  for (let w = -1; w <= 1; w++) {
    if (crypto.timingSafeEqual(Buffer.from(hotp(secret, step + w)), Buffer.from(clean))) {
      return true;
    }
  }
  return false;
}

export function otpauthUri(secretB32: string, account: string, issuer = "FBI Portal"): string {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({ secret: secretB32, issuer, digits: "6", period: "30" });
  return `otpauth://totp/${label}?${params.toString()}`;
}
