export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { requireApiActor } from "@/lib/auth";
import { handle, fail } from "@/lib/api";
import { can, investigationVisibilityFilter } from "@/lib/rbac";

function cell(v: unknown): string {
  return `"${(v == null ? "" : String(v)).replace(/"/g, '""')}"`;
}

export const GET = handle(async (req: Request) => {
  const actor = await requireApiActor();
  if (!can(actor, "reports.view")) return fail("Permission manquante : reports.view", 403);

  const sp = new URL(req.url).searchParams;
  const now = new Date();
  const from = sp.get("from")
    ? new Date(sp.get("from")!)
    : new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const to = sp.get("to") ? new Date(`${sp.get("to")}T23:59:59`) : now;

  const rows = await prisma.investigation.findMany({
    where: { AND: [investigationVisibilityFilter(actor), { openedAt: { gte: from, lte: to } }] },
    include: {
      leadAgent: { include: { user: true } },
      fieldOffice: true,
      _count: { select: { arrests: true, warrants: true, evidence: true, persons: true } },
    },
    orderBy: { openedAt: "desc" },
    take: 20000,
  });

  const header = [
    "case_number",
    "titre",
    "statut",
    "priorite",
    "classification",
    "field_office",
    "agent_responsable",
    "ouverte_le",
    "cloturee_le",
    "arrestations",
    "mandats",
    "preuves",
    "personnes",
  ];
  const body = rows.map((r) =>
    [
      r.caseNumber,
      r.title,
      r.status,
      r.priority,
      r.classification,
      r.fieldOffice?.name ?? "",
      r.leadAgent?.user.name ?? "",
      r.openedAt.toISOString().slice(0, 10),
      r.closedAt ? r.closedAt.toISOString().slice(0, 10) : "",
      r._count.arrests,
      r._count.warrants,
      r._count.evidence,
      r._count.persons,
    ]
      .map(cell)
      .join(","),
  );
  const csv = "﻿" + [header.map(cell).join(","), ...body].join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rapport-enquetes-${to.toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
});
