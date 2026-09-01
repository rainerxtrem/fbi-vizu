import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "fia_session";
const MAX_AGE = 60 * 60 * 8; // 8 hours

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new Error(
      "AUTH_SECRET is not set or is shorter than 32 characters. Set it in the environment.",
    );
  }
  return new TextEncoder().encode(s);
}

export interface SessionPayload {
  sub: string; // user id
  email: string;
  name: string;
  ver: number; // User.tokenVersion at issue time — mismatched sessions are rejected
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT({
    email: payload.email,
    name: payload.name,
    ver: payload.ver,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function readSession(): Promise<SessionPayload | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      sub: String(payload.sub),
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
      ver: Number(payload.ver ?? 0),
    };
  } catch {
    return null;
  }
}

export function destroySession(): void {
  cookies().set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
