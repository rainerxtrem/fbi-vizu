export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { handle, ok, created, pageParams } from "@/lib/api";
import { newsSchema } from "@/lib/validation";
import { requireApiPermission } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { uniqueNewsSlug } from "@/lib/ids";
import { audit } from "@/lib/audit";

export const GET = handle(async (req: Request) => {
  await requireApiPermission("news.view");
  const url = new URL(req.url);
  const { skip, take, page, pageSize } = pageParams(url, 20);
  const [total, items] = await Promise.all([
    prisma.news.count(),
    prisma.news.findMany({
      include: { author: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
  ]);
  return ok({ items, total, page, pageSize });
});

export const POST = handle(async (req: Request) => {
  const actor = await requireApiPermission("news.create");
  const d = newsSchema.parse(await req.json());

  const publish = d.status === "PUBLISHED" && can(actor, "news.publish");
  const slug = await uniqueNewsSlug(d.title);

  const article = await prisma.news.create({
    data: {
      slug,
      title: d.title,
      subtitle: d.subtitle ?? null,
      imageUrl: d.imageUrl ?? null,
      category: d.category,
      status: publish ? "PUBLISHED" : "DRAFT",
      content: d.content,
      authorId: actor.agent?.id ?? null,
      relatedInvestigationId: d.relatedInvestigationId || null,
      relatedMostWantedId: d.relatedMostWantedId || null,
      publishedAt: publish ? new Date() : null,
    },
  });

  await audit(actor, {
    action: "news.create",
    entityType: "news",
    entityId: article.id,
    summary: `${actor.name} created news article "${d.title}"${publish ? " (published)" : " (draft)"}`,
  });

  return created(article);
});
