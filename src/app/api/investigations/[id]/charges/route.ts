export const dynamic = "force-dynamic";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { handle, ok, created, fail } from "@/lib/api";
import { requireApiActor } from "@/lib/auth";
import { getInvestigationForEditOr404, canEditInvestigation } from "@/lib/access";
import { audit } from "@/lib/audit";

function chargeCode(title: string): string {
  return title
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/(^_|_$)/g, "")
    .slice(0, 40);
}

async function guard(id: string, actor: Parameters<typeof getInvestigationForEditOr404>[1]) {
  const inv = await getInvestigationForEditOr404(id, actor);
  const mayEdit = canEditInvestigation(actor, {
    leadAgentId: inv.leadAgentId,
    assignedAgentIds: inv.assignedAgentIds,
  });
  return { inv, mayEdit };
}

export const POST = handle(async (req: Request, { params }: { params: { id: string } }) => {
  const actor = await requireApiActor();
  const { inv, mayEdit } = await guard(params.id, actor);
  if (!mayEdit) return fail("Vous n'êtes pas autorisé à modifier ce dossier.", 403);

  const { chargeId, title, personId } = z
    .object({
      chargeId: z.string().max(40).optional(),
      title: z.string().trim().max(200).optional(),
      personId: z.string().max(40).optional(),
    })
    .refine((d) => d.chargeId || (d.title && d.title.length >= 2), {
      message: "Choisissez un chef d'accusation ou saisissez un intitulé.",
    })
    .parse(await req.json());

  let charge;
  if (chargeId) {
    charge = await prisma.charge.findUnique({ where: { id: chargeId } });
    if (!charge) return fail("Chef d'accusation introuvable.", 404);
  } else {
    charge = await prisma.charge.upsert({
      where: { code: chargeCode(title!) },
      update: {},
      create: { code: chargeCode(title!), title: title!, category: "Général", severity: "Felony" },
    });
  }

  const link = await prisma.investigationCharge
    .create({
      data: { investigationId: inv.id, chargeId: charge.id, personId: personId || null },
    })
    .catch(() => null);
  if (!link) return fail("Ce chef d'accusation est déjà rattaché au dossier.", 409);

  await audit(actor, {
    action: "investigation.charge.add",
    entityType: "investigation",
    entityId: inv.id,
    summary: `${actor.name} a ajouté « ${charge.title} » à ${inv.caseNumber}`,
  });
  return created({ id: link.id });
});

export const DELETE = handle(async (req: Request, { params }: { params: { id: string } }) => {
  const actor = await requireApiActor();
  const { inv, mayEdit } = await guard(params.id, actor);
  if (!mayEdit) return fail("Vous n'êtes pas autorisé à modifier ce dossier.", 403);

  const { linkId } = z.object({ linkId: z.string().min(1).max(40) }).parse(await req.json());
  const link = await prisma.investigationCharge.findFirst({
    where: { id: linkId, investigationId: inv.id },
    include: { charge: true },
  });
  if (!link) return fail("Rattachement introuvable.", 404);

  await prisma.investigationCharge.delete({ where: { id: link.id } });
  await audit(actor, {
    action: "investigation.charge.remove",
    entityType: "investigation",
    entityId: inv.id,
    summary: `${actor.name} a retiré « ${link.charge.title} » de ${inv.caseNumber}`,
  });
  return ok({ removed: true });
});
