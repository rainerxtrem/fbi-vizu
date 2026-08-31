export const dynamic = "force-dynamic";

import { handle, ok, fail, assertRateLimit } from "@/lib/api";
import { getActor } from "@/lib/auth";
import { storeUpload } from "@/lib/storage";

export const runtime = "nodejs";

export const POST = handle(async (req: Request) => {
  assertRateLimit(req, "upload", 30, 60_000);
  const actor = await getActor();

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return fail("Aucun fichier fourni.", 400);
  }

  try {
    const stored = await storeUpload(file, actor, String(form.get("description") ?? "") || undefined);
    return ok(stored);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Échec du téléversement.", 400);
  }
});
