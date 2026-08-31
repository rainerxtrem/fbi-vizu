import { NextResponse } from "next/server";
import { destroySession } from "@/lib/session";
import { getActor } from "@/lib/auth";
import { audit } from "@/lib/audit";

export async function POST() {
  const actor = await getActor();
  if (actor) {
    await audit(actor, { action: "auth.logout", summary: `${actor.name} signed out` });
  }
  destroySession();
  return NextResponse.json({ ok: true });
}
