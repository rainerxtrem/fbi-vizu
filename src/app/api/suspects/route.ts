export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { handle, ok, created, pageParams } from "@/lib/api";
import { personSchema } from "@/lib/validation";
import { requireApiPermission } from "@/lib/auth";
import { audit } from "@/lib/audit";

export const GET = handle(async (req: Request) => {
  await requireApiPermission("suspect.view");
  const url = new URL(req.url);
  const { skip, take, page, pageSize } = pageParams(url, 20);
  const q = url.searchParams.get("q")?.trim();
  const risk = url.searchParams.get("risk");

  const where: Record<string, unknown> = {};
  if (risk) where.riskLevel = risk;
  if (q) {
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { alias: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, suspects] = await Promise.all([
    prisma.person.count({ where }),
    prisma.person.findMany({
      where,
      include: {
        _count: { select: { investigations: true, evidence: true, warrants: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take,
    }),
  ]);

  return ok({ suspects, total, page, pageSize });
});

export const POST = handle(async (req: Request) => {
  const actor = await requireApiPermission("suspect.create");
  const d = personSchema.parse(await req.json());

  const person = await prisma.person.create({
    data: {
      fullName: d.fullName,
      alias: d.alias ?? null,
      dob: d.dob ? new Date(d.dob) : null,
      gender: d.gender ?? null,
      photoUrl: d.photoUrl ?? null,
      description: d.description ?? null,
      knownAddresses: d.knownAddresses ?? null,
      riskLevel: d.riskLevel,
      criminalHistory: d.criminalHistory ?? null,
      notes: d.notes ?? null,
      createdById: actor.agent?.id ?? null,
    },
  });

  await audit(actor, {
    action: "suspect.create",
    entityType: "person",
    entityId: person.id,
    summary: `${actor.name} created person record for ${person.fullName}`,
  });

  return created(person);
});
