export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handle, fail } from "@/lib/api";
import { requireApiActor } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { canViewInvestigation } from "@/lib/rbac";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "public", "uploads");

/** Can the actor see at least one of these investigations? */
async function canSeeAnyInvestigation(
  actor: Parameters<typeof canViewInvestigation>[0],
  ids: string[],
): Promise<boolean> {
  if (ids.length === 0) return false;
  const invs = await prisma.investigation.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      classification: true,
      leadAgentId: true,
      fieldOfficeId: true,
      isPublic: true,
      deletedAt: true,
      assignedAgents: { select: { agentId: true } },
    },
  });
  return invs.some(
    (inv) =>
      !inv.deletedAt &&
      canViewInvestigation(actor, {
        id: inv.id,
        classification: inv.classification,
        leadAgentId: inv.leadAgentId,
        fieldOfficeId: inv.fieldOfficeId,
        isPublic: inv.isPublic,
        assignedAgentIds: inv.assignedAgents.map((a) => a.agentId),
      }),
  );
}

export const GET = handle(
  async (_req: Request, { params }: { params: { id: string } }) => {
    const actor = await requireApiActor();

    const file = await prisma.fileAsset.findUnique({
      where: { id: params.id },
      include: {
        evidence: { select: { investigationId: true, deletedAt: true } },
        documents: { select: { investigationId: true } },
        tips: { select: { assignedToId: true } },
      },
    });
    if (!file) return fail("Fichier introuvable.", 404);

    // Work out whether this actor is entitled to this specific file.
    let allowed = false;

    const evidenceInvIds = file.evidence.filter((e) => !e.deletedAt).map((e) => e.investigationId);
    if (evidenceInvIds.length && can(actor, "evidence.download")) {
      allowed = await canSeeAnyInvestigation(actor, evidenceInvIds);
    }

    if (!allowed && file.documents.length && can(actor, "document.view")) {
      allowed = await canSeeAnyInvestigation(
        actor,
        file.documents.map((d) => d.investigationId).filter((x): x is string => !!x),
      );
    }

    if (!allowed && file.tips.length && can(actor, "tips.view")) {
      allowed =
        can(actor, "tips.view.all") ||
        file.tips.some((t) => t.assignedToId && t.assignedToId === actor.agent?.id);
    }

    if (!allowed && can(actor, "applications.review")) {
      const app = await prisma.application.findFirst({
        where: {
          OR: [
            { resumeUrl: file.url },
            { idUrl: file.url },
            { certUrl: file.url },
            { additionalUrl: file.url },
          ],
        },
        select: { id: true },
      });
      if (app) allowed = true;
    }

    if (!allowed) return fail("Vous n'êtes pas autorisé à consulter ce fichier.", 403);

    // Serve the bytes off disk. filename is generated (timestamp-hex.ext), no traversal risk,
    // but normalise defensively.
    const safe = path.basename(file.filename);
    let bytes: Buffer;
    try {
      bytes = await fs.readFile(path.join(UPLOAD_DIR, safe));
    } catch {
      return fail("Fichier absent du stockage.", 410);
    }

    const body = new Uint8Array(bytes);
    return new NextResponse(body, {
      headers: {
        "Content-Type": file.mimeType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${encodeURIComponent(file.originalName)}"`,
        "Cache-Control": "private, max-age=0, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  },
);
