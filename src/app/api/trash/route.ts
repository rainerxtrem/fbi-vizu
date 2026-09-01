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
};

const actionSchema = z.object({
  entity: z.enum(["investigation", "person", "evidence"]),
  id: z.string().min(1).max(40),
  action: z.enum(["restore", "purge"]),
});

export const GET = handle(async () => {
  const actor = await requireApiActor();

  const [investigations, persons, evidence] = await Promise.all([
    can(actor, "investigation.delete")
      ? prisma.investigation.findMany({
          where: { deletedAt: { not: null } },
          orderBy: { deletedAt: "desc" },
          select: { id: true, caseNumber: true, title: true, deletedAt: true },
        })
      : [],
    can(actor, "suspect.delete")
      ? prisma.person.findMany({
          where: { deletedAt: { not: null } },
          orderBy: { deletedAt: "desc" },
          select: { id: true, fullName: true, alias: true, deletedAt: true },
        })
      : [],
    can(actor, "evidence.delete")
      ? prisma.evidence.findMany({
          where: { deletedAt: { not: null } },
          orderBy: { deletedAt: "desc" },
          select: {
            id: true,
            evidenceNumber: true,
            title: true,
            deletedAt: true,
            investigation: { select: { id: true, caseNumber: true } },
          },
        })
      : [],
  ]);

  return ok({ investigations, persons, evidence });
});

export const POST = handle(async (req: Request) => {
  const actor = await requireApiActor();
  const { entity, id, action } = actionSchema.parse(await req.json());

  if (!can(actor, ENTITY_PERM[entity])) {
    return fail(`Permission manquante : ${ENTITY_PERM[entity]}`, 403);
  }

  if (entity === "investigation") {
    const inv = await prisma.investigation.findUnique({ where: { id } });
    if (!inv || !inv.deletedAt) return fail("Élément introuvable dans la corbeille.", 404);
    if (action === "restore") {
      await prisma.investigation.update({
        where: { id },
        data: { deletedAt: null, deletedById: null },
      });
    } else {
      await prisma.investigation.delete({ where: { id } });
    }
    await audit(actor, {
      action: `investigation.${action}`,
      entityType: "investigation",
      entityId: id,
      summary: `${actor.name} a ${action === "restore" ? "restauré" : "purgé définitivement"} l'enquête ${inv.caseNumber}`,
    });
    return ok({ done: true });
  }

  if (entity === "person") {
    const person = await prisma.person.findUnique({ where: { id } });
    if (!person || !person.deletedAt) return fail("Élément introuvable dans la corbeille.", 404);
    if (action === "restore") {
      await prisma.person.update({
        where: { id },
        data: { deletedAt: null, deletedById: null },
      });
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
      summary: `${actor.name} a ${action === "restore" ? "restauré" : "purgé définitivement"} la fiche de ${person.fullName}`,
    });
    return ok({ done: true });
  }

  // evidence
  const ev = await prisma.evidence.findUnique({ where: { id } });
  if (!ev || !ev.deletedAt) return fail("Élément introuvable dans la corbeille.", 404);
  if (action === "restore") {
    await prisma.evidence.update({
      where: { id },
      data: { deletedAt: null, deletedById: null },
    });
  } else {
    await prisma.evidence.delete({ where: { id } });
  }
  await audit(actor, {
    action: `evidence.${action}`,
    entityType: "evidence",
    entityId: id,
    summary: `${actor.name} a ${action === "restore" ? "restauré" : "purgé définitivement"} la preuve #${ev.evidenceNumber}`,
  });
  return ok({ done: true });
});
