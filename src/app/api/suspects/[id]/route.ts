export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { handle, ok, fail } from "@/lib/api";
import { personSchema } from "@/lib/validation";
import { requireApiActor, requireApiPermission } from "@/lib/auth";
import { audit } from "@/lib/audit";

export const GET = handle(
  async (_req: Request, { params }: { params: { id: string } }) => {
    await requireApiPermission("suspect.view");
    const person = await prisma.person.findUnique({
      where: { id: params.id },
      include: {
        investigations: { include: { investigation: true } },
        vehicles: { include: { vehicle: true } },
        organizations: { include: { organization: true } },
        evidence: true,
        warrants: true,
        arrests: true,
        mostWanted: true,
      },
    });
    if (!person) return fail("Introuvable.", 404);
    return ok(person);
  },
);

export const PATCH = handle(
  async (req: Request, { params }: { params: { id: string } }) => {
    const actor = await requireApiPermission("suspect.edit");
    const d = personSchema.partial().parse(await req.json());
    const existing = await prisma.person.findUnique({ where: { id: params.id } });
    if (!existing) return fail("Introuvable.", 404);

    const person = await prisma.person.update({
      where: { id: params.id },
      data: {
        fullName: d.fullName ?? undefined,
        alias: d.alias ?? undefined,
        dob: d.dob ? new Date(d.dob) : undefined,
        gender: d.gender ?? undefined,
        photoUrl: d.photoUrl ?? undefined,
        description: d.description ?? undefined,
        knownAddresses: d.knownAddresses ?? undefined,
        riskLevel: d.riskLevel ?? undefined,
        criminalHistory: d.criminalHistory ?? undefined,
        notes: d.notes ?? undefined,
      },
    });

    await audit(actor, {
      action: "suspect.update",
      entityType: "person",
      entityId: person.id,
      summary: `${actor.name} a mis à jour la fiche #${person.id.slice(-6)} (${person.fullName})`,
    });

    return ok(person);
  },
);

export const DELETE = handle(
  async (_req: Request, { params }: { params: { id: string } }) => {
    const actor = await requireApiPermission("suspect.delete");
    const person = await prisma.person.findUnique({
      where: { id: params.id },
      include: { _count: { select: { investigations: true, arrests: true, mostWanted: true } } },
    });
    if (!person) return fail("Introuvable.", 404);

    // Detach optional references, then remove the person and its dependent rows.
    await prisma.$transaction([
      prisma.evidence.updateMany({ where: { personId: person.id }, data: { personId: null } }),
      prisma.warrant.updateMany({ where: { personId: person.id }, data: { personId: null } }),
      prisma.mostWanted.updateMany({ where: { personId: person.id }, data: { personId: null } }),
      prisma.investigationCharge.updateMany({
        where: { personId: person.id },
        data: { personId: null },
      }),
      prisma.arrest.deleteMany({ where: { personId: person.id } }),
      prisma.person.delete({ where: { id: person.id } }),
    ]);

    await audit(actor, {
      action: "suspect.delete",
      entityType: "person",
      entityId: person.id,
      summary: `${actor.name} a supprimé la fiche de ${person.fullName}`,
      meta: {
        investigations: person._count.investigations,
        arrests: person._count.arrests,
        mostWanted: person._count.mostWanted,
      },
    });

    return ok({ deleted: true });
  },
);

export const POST = handle(
  async (req: Request, { params }: { params: { id: string } }) => {
    // link actions: { action: "link-investigation", investigationId, role }
    const actor = await requireApiActor();
    const body = await req.json();
    const person = await prisma.person.findUnique({ where: { id: params.id } });
    if (!person) return fail("Introuvable.", 404);

    if (body.action === "link-investigation" && body.investigationId) {
      await prisma.investigationPerson
        .create({
          data: {
            investigationId: body.investigationId,
            personId: person.id,
            role: (body.role ?? "SUSPECT") as never,
          },
        })
        .catch(() => undefined);
      await audit(actor, {
        action: "suspect.link",
        entityType: "person",
        entityId: person.id,
        summary: `${actor.name} a lié ${person.fullName} à un dossier`,
      });
      return ok({ linked: true });
    }

    return fail("Action inconnue.", 400);
  },
);
