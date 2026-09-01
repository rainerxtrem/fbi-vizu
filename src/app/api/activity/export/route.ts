export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { requireApiPermission } from "@/lib/auth";
import { handle } from "@/lib/api";

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

export const GET = handle(async (req: Request) => {
  await requireApiPermission("audit.view");
  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") ?? "").trim();
  const actor = (sp.get("actor") ?? "").trim();
  const entity = (sp.get("entity") ?? "").trim();
  const from = sp.get("from");
  const to = sp.get("to");

  const and: object[] = [];
  if (q)
    and.push({
      OR: [
        { summary: { contains: q, mode: "insensitive" as const } },
        { action: { contains: q, mode: "insensitive" as const } },
      ],
    });
  if (actor) and.push({ actorLabel: { contains: actor, mode: "insensitive" as const } });
  if (entity) and.push({ entityType: entity });
  if (from) and.push({ createdAt: { gte: new Date(from) } });
  if (to) and.push({ createdAt: { lte: new Date(`${to}T23:59:59`) } });

  const rows = await prisma.auditLog.findMany({
    where: and.length ? { AND: and } : {},
    orderBy: { createdAt: "desc" },
    take: 20000,
  });

  const header = ["horodatage", "acteur", "action", "type_entite", "id_entite", "resume", "ip"];
  const body = rows.map((r) =>
    [
      r.createdAt.toISOString(),
      r.actorLabel,
      r.action,
      r.entityType ?? "",
      r.entityId ?? "",
      r.summary,
      r.ip ?? "",
    ]
      .map(csvCell)
      .join(","),
  );
  const csv = "﻿" + [header.map(csvCell).join(","), ...body].join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="journal-activite-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
});
