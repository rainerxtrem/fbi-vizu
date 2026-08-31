import { prisma } from "@/lib/db";
import { handle, ok, created, fail, pageParams } from "@/lib/api";
import { investigationCreateSchema } from "@/lib/validation";
import { requireApiActor, requireApiPermission } from "@/lib/auth";
import { investigationVisibilityFilter, can } from "@/lib/rbac";
import { nextCaseNumber } from "@/lib/ids";
import { audit } from "@/lib/audit";
import { addTimelineEvent } from "@/lib/timeline";

export const GET = handle(async (req: Request) => {
  const actor = await requireApiActor();
  const url = new URL(req.url);
  const { skip, take, page, pageSize } = pageParams(url, 20);
  const status = url.searchParams.get("status");
  const priority = url.searchParams.get("priority");
  const mine = url.searchParams.get("mine") === "1";
  const q = url.searchParams.get("q")?.trim();

  const and: object[] = [investigationVisibilityFilter(actor)];
  if (status) and.push({ status });
  if (priority) and.push({ priority });
  if (mine && actor.agent) {
    and.push({
      OR: [
        { leadAgentId: actor.agent.id },
        { assignedAgents: { some: { agentId: actor.agent.id } } },
      ],
    });
  }
  if (q) {
    and.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { caseNumber: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  const where = { AND: and };
  const [total, investigations] = await Promise.all([
    prisma.investigation.count({ where }),
    prisma.investigation.findMany({
      where,
      include: {
        leadAgent: { include: { user: true } },
        fieldOffice: true,
        _count: { select: { assignedAgents: true, evidence: true, persons: true } },
      },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      skip,
      take,
    }),
  ]);

  return ok({ investigations, total, page, pageSize });
});

export const POST = handle(async (req: Request) => {
  const actor = await requireApiPermission("investigation.create");
  const d = investigationCreateSchema.parse(await req.json());

  if (!actor.agent) return fail("Only agents can create investigations.", 403);

  const caseNumber = d.caseNumber || (await nextCaseNumber());
  const existing = await prisma.investigation.findUnique({ where: { caseNumber } });
  if (existing) return fail("Case number already exists.", 409);

  const inv = await prisma.investigation.create({
    data: {
      caseNumber,
      title: d.title,
      description: d.description,
      classification: d.classification,
      priority: d.priority,
      status: d.status,
      leadAgentId: d.leadAgentId || actor.agent.id,
      fieldOfficeId: d.fieldOfficeId || actor.agent.fieldOfficeId,
      division: d.division ?? actor.agent.division,
      unit: d.unit ?? actor.agent.unit,
      taskForce: d.taskForce ?? null,
      incidentDate: d.incidentDate ? new Date(d.incidentDate) : null,
      incidentLocation: d.incidentLocation ?? null,
      jurisdiction: d.jurisdiction ?? null,
      openedAt: new Date(),
      assignedAgents: {
        create: Array.from(new Set(d.assignedAgentIds))
          .filter(Boolean)
          .map((agentId) => ({ agentId })),
      },
      charges: {
        create: [],
      },
    },
  });

  // Link charges by title
  for (const title of d.charges) {
    const charge = await prisma.charge.upsert({
      where: { code: chargeCode(title) },
      update: {},
      create: { code: chargeCode(title), title, category: "General", severity: "Felony" },
    });
    await prisma.investigationCharge
      .create({ data: { investigationId: inv.id, chargeId: charge.id } })
      .catch(() => undefined);
  }

  // Link persons by role — entries may be an existing person id or a new name
  await linkPersons(inv.id, d.suspects, "SUSPECT", actor.agent.id);
  await linkPersons(inv.id, d.victims, "VICTIM", actor.agent.id);
  await linkPersons(inv.id, d.witnesses, "WITNESS", actor.agent.id);

  if (d.notes) {
    await prisma.investigationNote.create({
      data: { investigationId: inv.id, authorId: actor.agent.id, body: d.notes },
    });
  }

  await addTimelineEvent(
    inv.id,
    "INVESTIGATION_OPENED",
    `Investigation opened by ${actor.name}`,
    actor,
  );
  await audit(actor, {
    action: "investigation.create",
    entityType: "investigation",
    entityId: inv.id,
    summary: `${actor.name} created investigation ${inv.caseNumber}`,
  });

  return created({ id: inv.id, caseNumber: inv.caseNumber });
});

function chargeCode(title: string): string {
  return title
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/(^_|_$)/g, "")
    .slice(0, 40);
}

async function linkPersons(
  investigationId: string,
  entries: string[],
  role: string,
  createdById: string,
) {
  for (const raw of entries.map((e) => e.trim()).filter(Boolean)) {
    let personId = raw;
    const existing = raw.length > 20 ? await prisma.person.findUnique({ where: { id: raw } }) : null;
    if (!existing) {
      const created = await prisma.person.create({
        data: {
          fullName: raw,
          riskLevel: role === "SUSPECT" ? "MEDIUM" : "LOW",
          createdById,
        },
      });
      personId = created.id;
    }
    await prisma.investigationPerson
      .create({ data: { investigationId, personId, role: role as never } })
      .catch(() => undefined);
  }
}
