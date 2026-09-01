export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { handle, ok, assertRateLimit } from "@/lib/api";
import { requireApiPermission } from "@/lib/auth";

export const GET = handle(async (req: Request) => {
  assertRateLimit(req, "person-search", 60, 60_000);
  await requireApiPermission("suspect.view");
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return ok({ persons: [] });

  const like = { contains: q, mode: "insensitive" as const };
  const persons = await prisma.person.findMany({
    where: { deletedAt: null, OR: [{ fullName: like }, { alias: like }] },
    orderBy: { fullName: "asc" },
    take: 15,
    select: { id: true, fullName: true, alias: true, riskLevel: true },
  });

  return ok({ persons });
});
