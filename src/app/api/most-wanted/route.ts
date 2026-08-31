export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { handle, ok, created, fail, pageParams } from "@/lib/api";
import { mostWantedCreateSchema } from "@/lib/validation";
import { requireApiActor, requireApiPermission } from "@/lib/auth";
import { getInvestigationOr404 } from "@/lib/access";
import { can } from "@/lib/rbac";
import { nextMostWantedPublicId } from "@/lib/ids";
import { addTimelineEvent } from "@/lib/timeline";
import { audit } from "@/lib/audit";

// GET — agents see all workflow states; public list endpoint lives in pages.
export const GET = handle(async (req: Request) => {
  await requireApiPermission("mostwanted.view");
  const url = new URL(req.url);
  const { skip, take, page, pageSize } = pageParams(url, 20);
  const status = url.searchParams.get("status");
  const where = status ? { status: status as never } : {};

  const [total, items] = await Promise.all([
    prisma.mostWanted.count({ where }),
    prisma.mostWanted.findMany({
      where,
      include: {
        createdBy: { include: { user: true } },
        reviewedBy: { include: { user: true } },
        investigation: true,
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take,
    }),
  ]);

  return ok({ items, total, page, pageSize });
});

// POST — create a Most Wanted draft (optionally from an investigation)
export const POST = handle(async (req: Request) => {
  const actor = await requireApiPermission("mostwanted.create");
  const d = mostWantedCreateSchema.parse(await req.json());

  let caseNumber = d.caseNumber ?? null;
  let leadAgent = d.leadAgent ?? null;
  let openedDate: Date | null = null;

  if (d.investigationId) {
    const inv = await getInvestigationOr404(d.investigationId, actor);
    caseNumber = caseNumber ?? inv.caseNumber;
    leadAgent = leadAgent ?? (inv.leadAgent ? inv.leadAgent.user.name : null);
    openedDate = inv.openedAt;
  }

  const publicId = await nextMostWantedPublicId();
  const mw = await prisma.mostWanted.create({
    data: {
      publicId,
      status: "DRAFT",
      category: d.category,
      dangerLevel: d.dangerLevel,
      fullName: d.fullName,
      aliases: d.aliases ?? null,
      age: d.age ?? null,
      photoUrl: d.photoUrl ?? null,
      description: d.description,
      charges: d.charges,
      reward: d.reward,
      lastKnownLocation: d.lastKnownLocation ?? null,
      vehicle: d.vehicle ?? null,
      associates: d.associates ?? null,
      knownOrganizations: d.knownOrganizations ?? null,
      dateLastSeen: d.dateLastSeen ? new Date(d.dateLastSeen) : null,
      caseNumber,
      leadAgent,
      openedDate,
      personId: d.personId || null,
      investigationId: d.investigationId || null,
      createdById: actor.agent?.id ?? null,
    },
  });

  if (d.investigationId) {
    await addTimelineEvent(
      d.investigationId,
      "MOST_WANTED_CREATED",
      `${actor.name} a rédigé le bulletin Most Wanted ${publicId} pour ${d.fullName}`,
      actor,
    );
  }
  await audit(actor, {
    action: "mostwanted.create",
    entityType: "most_wanted",
    entityId: mw.id,
    summary: `${actor.name} a créé le brouillon Most Wanted ${publicId} (${d.fullName})`,
  });

  return created({ id: mw.id, publicId: mw.publicId });
});
