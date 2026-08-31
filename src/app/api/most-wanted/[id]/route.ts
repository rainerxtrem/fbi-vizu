export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { handle, ok, fail } from "@/lib/api";
import { mostWantedUpdateSchema } from "@/lib/validation";
import { requireApiActor, requireApiPermission } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";

export const GET = handle(
  async (_req: Request, { params }: { params: { id: string } }) => {
    await requireApiPermission("mostwanted.view");
    const mw = await prisma.mostWanted.findUnique({
      where: { id: params.id },
      include: {
        createdBy: { include: { user: true } },
        reviewedBy: { include: { user: true } },
        investigation: true,
        person: true,
      },
    });
    if (!mw) return fail("Introuvable.", 404);
    return ok(mw);
  },
);

export const PATCH = handle(
  async (req: Request, { params }: { params: { id: string } }) => {
    const actor = await requireApiActor();
    const mw = await prisma.mostWanted.findUnique({ where: { id: params.id } });
    if (!mw) return fail("Introuvable.", 404);

    const d = mostWantedUpdateSchema.parse(await req.json());
    const isCreator = mw.createdById && mw.createdById === actor.agent?.id;
    const canEdit = can(actor, "mostwanted.edit") || (isCreator && mw.status === "DRAFT");

    // Field edits
    const fieldKeys = Object.keys(d).filter((k) => k !== "status");
    if (fieldKeys.length > 0 && !canEdit) {
      return fail("Vous n'êtes pas autorisé à modifier ce bulletin.", 403);
    }

    // Workflow transition guards
    const data: Record<string, unknown> = {};
    if (d.status && d.status !== mw.status) {
      const t = `${mw.status}->${d.status}`;
      const publishPerms = can(actor, "mostwanted.publish");
      const reviewPerms = can(actor, "mostwanted.review") || can(actor, "mostwanted.publish");
      const allowed =
        (t === "DRAFT->REVIEW" && (canEdit || can(actor, "mostwanted.create"))) ||
        (t === "REVIEW->DRAFT" && reviewPerms) ||
        (t === "REVIEW->PUBLISHED" && publishPerms) ||
        (t === "DRAFT->PUBLISHED" && publishPerms) ||
        (t === "PUBLISHED->CAPTURED" && (can(actor, "mostwanted.edit") || publishPerms)) ||
        (t === "PUBLISHED->LOCATED" && (can(actor, "mostwanted.edit") || publishPerms)) ||
        ((d.status === "ARCHIVED") && can(actor, "mostwanted.archive"));

      if (!allowed) return fail(`Transition non autorisée : ${t}`, 403);

      data.status = d.status;
      if (d.status === "PUBLISHED") {
        data.publishedAt = new Date();
        data.reviewedById = actor.agent?.id ?? null;
      }
      if (d.status === "CAPTURED" || d.status === "LOCATED") data.capturedAt = new Date();
    }

    if (canEdit) {
      for (const k of fieldKeys) {
        const v = (d as Record<string, unknown>)[k];
        if (v === undefined) continue;
        if (k === "dateLastSeen") data[k] = v ? new Date(v as string) : null;
        else data[k] = v;
      }
    }

    const updated = await prisma.mostWanted.update({ where: { id: mw.id }, data });

    await audit(actor, {
      action: d.status ? "mostwanted.transition" : "mostwanted.update",
      entityType: "most_wanted",
      entityId: mw.id,
      summary: `${actor.name} ${
        d.status ? `a fait passer ${mw.publicId} au statut ${d.status}` : `a mis à jour ${mw.publicId}`
      }`,
      meta: { from: mw.status, to: d.status },
    });

    return ok(updated);
  },
);

export const DELETE = handle(
  async (_req: Request, { params }: { params: { id: string } }) => {
    const actor = await requireApiPermission("mostwanted.delete");
    const mw = await prisma.mostWanted.findUnique({ where: { id: params.id } });
    if (!mw) return fail("Introuvable.", 404);
    await prisma.mostWanted.delete({ where: { id: mw.id } });
    await audit(actor, {
      action: "mostwanted.delete",
      entityType: "most_wanted",
      entityId: mw.id,
      summary: `${actor.name} a supprimé le Most Wanted ${mw.publicId}`,
    });
    return ok({ deleted: true });
  },
);
