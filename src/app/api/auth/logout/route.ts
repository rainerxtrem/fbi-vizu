export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { destroySession } from "@/lib/session";
import { getActor } from "@/lib/auth";
import { audit } from "@/lib/audit";

export async function POST() {
  const actor = await getActor();
  if (actor) {
    await audit(actor, { action: "auth.logout", summary: `${actor.name} s'est déconnecté` });
  }
  destroySession();
  return NextResponse.json({ ok: true });
}
