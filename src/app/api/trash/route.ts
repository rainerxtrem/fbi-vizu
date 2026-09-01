export const dynamic = "force-dynamic";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { handle, ok, fail } from "@/lib/api";
import { requireApiActor } from "@/lib/auth";
import { can, type Permission } from "@/lib/rbac";
import { audit } from "@/lib/audit";

const ENTITY_PERM: Record<string, Permission> = {
  investigation: "investigation.delete",
  person: "suspect.delete",
  evidence: "evidence.delete",
  warrant: "warrant.delete",
  arrest: "arrest.delete",
};

const actionSchema = z.object({
  entity: z.enum(["investigation", "person", "evidence", "warrant", "arrest"]),
  id: z.string().min(1).max(40),
  action: z.enum(["restore", "purge"]),
});

const deleted = { deletedAt: { not: null } } as const;

export const GET = handle(async () => {
  const actor = await requireApiActor();

  const [investigations, persons, evidence, warrants, arrests] = await Promise.all([
    can(actor, "investigation.delete")
      ? prisma.investigation.findMany({
          where: deleted,
          orderBy: { deletedAt: "desc" },
          select: { id: true, caseNumber: true, title: true, deletedAt: true },
        })
      : [],
    can(actor, "suspect.delete")
      ? prisma.person.findMany({
          where: deleted,
          orderBy: { deletedAt: "desc" },
          select: { id: true, fullName: true, alias: true, deletedAt: true },
        })
      : [],
    can(actor, "evidence.delete")
      ? prisma.evidence.findMany({
          where: deleted,
          orderBy: { deletedAt: "desc" },
          select: {
            id: true,
            evidenceNumber: true,
            title: true,
            deletedAt: true,
            investigation: { select: { caseNumber: true } },
          },
        })
      : [],
    can(actor, "warrant.delete")
      ? prisma.warrant.findMany({
          where: deleted,
          orderBy: { deletedAt: "desc" },
          select: {
            id: true,
            warrantNumber: true,
            type: true,
            deletedAt: true,
            investigation: { select: { caseNumber: true } },
          },
        })
      : [],
    can(actor, "arrest.delete")
      ? prisma.arrest.findMany({
          where: deleted,
          orderBy: { deletedAt: "desc" },
          select: {
            id: true,
            deletedAt: true,
            person: { select: { fullName: true } },
            investigation: { select: { caseNumber: true } },
          },
        })
      : [],
  ]);

  return ok({ investigations, persons, evidence, warrants, arrests });
});

export const POST = handle(async (req: Request) => {
  const actor = await requireApiActor();
  const { entity, id, action } = actionSchema.parse(await req.json());

  if (!can(actor, ENTITY_PERM[entity])) {
    return fail(`Permission manquante : ${ENTITY_PERM[entity]}`, 403);
  }

  const restore = action === "restore";
  const label = (s: string) => (restore ? `a restauré ${s}` : `a purgé définitivement ${s}`);

  if (entity === "investigation") {
    const row = await prisma.investigation.findFirst({ where: { id, ...deleted } });
    if (!row) return fail("Élément introuvable dans la corbeille.", 404);
    if (restore) {
      await prisma.investigation.update({ where: { id }, data: { deletedAt: null, deletedById: null } });
    } else {
      await prisma.investigation.delete({ where: { id } });
    }
    await audit(actor, {
      action: `investigation.${action}`,
      entityType: "investigation",
      entityId: id,
      summary: `${actor.name} ${label(`l'enquête ${row.caseNumber}`)}`,
    });
    return ok({ done: true });
  }

  if (entity === "person") {
    const row = await prisma.person.findFirst({ where: { id, ...deleted } });
    if (!row) return fail("Élément introuvable dans la corbeille.", 404);
    if (restore) {
      await prisma.person.update({ where: { id }, data: { deletedAt: null, deletedById: null } });
    } else {
      await prisma.$transaction([
        prisma.evidence.updateMany({ where: { personId: id }, data: { personId: null } }),
        prisma.warrant.updateMany({ where: { personId: id }, data: { personId: null } }),
        prisma.mostWanted.updateMany({ where: { personId: id }, data: { personId: null } }),
        prisma.investigationCharge.updateMany({ where: { personId: id }, data: { personId: null } }),
        prisma.arrest.deleteMany({ where: { personId: id } }),
        prisma.person.delete({ where: { id } }),
      ]);
    }
    await audit(actor, {
      action: `suspect.${action}`,
      entityType: "person",
      entityId: id,
      summary: `${actor.name} ${label(`la fiche de ${row.fullName}`)}`,
    });
    return ok({ done: true });
  }

  if (entity === "evidence") {
    const row = await prisma.evidence.findFirst({ where: { id, ...deleted } });
    if (!row) return fail("Élément introuvable dans la corbeille.", 404);
    if (restore) {
      await prisma.evidence.update({ where: { id }, data: { deletedAt: null, deletedById: null } });
    } else {
      await prisma.evidence.delete({ where: { id } });
    }
    await audit(actor, {
      action: `evidence.${action}`,
      entityType: "evidence",
      entityId: id,
      summary: `${actor.name} ${label(`la preuve #${row.evidenceNumber}`)}`,
    });
    return ok({ done: true });
  }

  if (entity === "warrant") {
    const row = await prisma.warrant.findFirst({ where: { id, ...deleted } });
    if (!row) return fail("Élément introuvable dans la corbeille.", 404);
    if (restore) {
      await prisma.warrant.update({ where: { id }, data: { deletedAt: null, deletedById: null } });
    } else {
      await prisma.warrant.delete({ where: { id } });
    }
    await audit(actor, {
      action: `warrant.${action}`,
      entityType: "warrant",
      entityId: id,
      summary: `${actor.name} ${label(`le mandat ${row.warrantNumber}`)}`,
    });
    return ok({ done: true });
  }

  // arrest
  const row = await prisma.arrest.findFirst({
    where: { id, ...deleted },
    include: { person: { select: { fullName: true } } },
  });
  if (!row) return fail("Élément introuvable dans la corbeille.", 404);
  if (restore) {
    await prisma.arrest.update({ where: { id }, data: { deletedAt: null, deletedById: null } });
  } else {
    await prisma.arrest.delete({ where: { id } });
  }
  await audit(actor, {
    action: `arrest.${action}`,
    entityType: "arrest",
    entityId: id,
    summary: `${actor.name} ${label(`l'arrestation de ${row.person.fullName}`)}`,
  });
  return ok({ done: true });
});
