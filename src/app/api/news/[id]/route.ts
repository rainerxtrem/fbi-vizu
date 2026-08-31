export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { handle, ok, fail } from "@/lib/api";
import { newsSchema } from "@/lib/validation";
import { requireApiPermission } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";

export const PATCH = handle(
  async (req: Request, { params }: { params: { id: string } }) => {
    const actor = await requireApiPermission("news.edit");
    const d = newsSchema.partial().parse(await req.json());
    const existing = await prisma.news.findUnique({ where: { id: params.id } });
    if (!existing) return fail("Introuvable.", 404);

    let publishedAt = existing.publishedAt;
    let status = d.status ?? existing.status;
    if (d.status === "PUBLISHED") {
      if (!can(actor, "news.publish")) return fail("Permission manquante : news.publish", 403);
      publishedAt = existing.publishedAt ?? new Date();
    }
    if (d.status && d.status !== "PUBLISHED") publishedAt = d.status === "DRAFT" ? null : publishedAt;

    const updated = await prisma.news.update({
      where: { id: params.id },
      data: {
        title: d.title ?? undefined,
        subtitle: d.subtitle ?? undefined,
        imageUrl: d.imageUrl ?? undefined,
        category: d.category ?? undefined,
        content: d.content ?? undefined,
        status,
        publishedAt,
        relatedInvestigationId: d.relatedInvestigationId ?? undefined,
        relatedMostWantedId: d.relatedMostWantedId ?? undefined,
      },
    });

    await audit(actor, {
      action: "news.update",
      entityType: "news",
      entityId: updated.id,
      summary: `${actor.name} a mis à jour l'article « ${updated.title} »${
        d.status ? ` → ${d.status}` : ""
      }`,
    });

    return ok(updated);
  },
);
