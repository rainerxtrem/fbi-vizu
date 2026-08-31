export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { handle, ok, created, fail } from "@/lib/api";
import { investigationPersonSchema } from "@/lib/validation";
import { requireApiActor } from "@/lib/auth";
import { getInvestigationOr404, canEditInvestigation } from "@/lib/access";
import { can } from "@/lib/rbac";
import { addTimelineEvent } from "@/lib/timeline";
import { audit } from "@/lib/audit";

const ROLE_FR: Record<string, string> = {
  SUSPECT: "suspect",
  VICTIM: "victime",
  WITNESS: "témoin",
  ASSOCIATE: "associé",
  PERSON_OF_INTEREST: "personne d'intérêt",
};

async function guard(id: string, actor: Parameters<typeof getInvestigationOr404>[1]) {
  const inv = await getInvestigationOr404(id, actor);
  const assignedAgentIds = inv.assignedAgents.map((a) => a.agentId);
  const mayEdit =
    can(actor, "person.link") &&
    canEditInvestigation(actor, { leadAgentId: inv.leadAgentId, assignedAgentIds });
  return { inv, mayEdit };
}

export const POST = handle(
  async (req: Request, { params }: { params: { id: string } }) => {
    const actor = await requireApiActor();
    const { inv, mayEdit } = await guard(params.id, actor);
    if (!mayEdit) return fail("Vous n'êtes pas autorisé à modifier les personnes de ce dossier.", 403);

    const d = investigationPersonSchema.parse(await req.json());

    let personId = d.personId ?? "";
    let personName = "";

    if (personId) {
      const existing = await prisma.person.findUnique({ where: { id: personId } });
      if (!existing) return fail("Personne introuvable.", 404);
      personName = existing.fullName;
    } else {
      if (!can(actor, "suspect.create")) {
        return fail("Permission manquante pour créer une nouvelle fiche : suspect.create", 403);
      }
      const person = await prisma.person.create({
        data: {
          fullName: d.fullName!,
          riskLevel: d.role === "SUSPECT" ? "MEDIUM" : "LOW",
          createdById: actor.agent?.id ?? null,
        },
      });
      personId = person.id;
      personName = person.fullName;
    }

    const link = await prisma.investigationPerson
      .create({
        data: {
          investigationId: inv.id,
          personId,
          role: d.role as never,
          notes: d.notes ?? null,
        },
      })
      .catch(() => null);

    if (!link) return fail("Cette personne est déjà liée au dossier avec ce rôle.", 409);

    await addTimelineEvent(
      inv.id,
      "PERSON_LINKED",
      `${actor.name} a ajouté ${personName} (${ROLE_FR[d.role] ?? d.role}) au dossier`,
      actor,
    );
    await audit(actor, {
      action: "person.link",
      entityType: "investigation",
      entityId: inv.id,
      summary: `${actor.name} a lié ${personName} à ${inv.caseNumber} (${ROLE_FR[d.role] ?? d.role})`,
    });

    return created({ id: link.id, personId });
  },
);

export const DELETE = handle(
  async (req: Request, { params }: { params: { id: string } }) => {
    const actor = await requireApiActor();
    const { inv, mayEdit } = await guard(params.id, actor);
    if (!mayEdit) return fail("Vous n'êtes pas autorisé à modifier les personnes de ce dossier.", 403);

    const body = await req.json().catch(() => ({}));
    const linkId = String(body.linkId ?? "");
    const link = await prisma.investigationPerson.findFirst({
      where: { id: linkId, investigationId: inv.id },
      include: { person: true },
    });
    if (!link) return fail("Lien introuvable.", 404);

    await prisma.investigationPerson.delete({ where: { id: link.id } });
    await audit(actor, {
      action: "person.unlink",
      entityType: "investigation",
      entityId: inv.id,
      summary: `${actor.name} a retiré ${link.person.fullName} de ${inv.caseNumber}`,
    });
    return ok({ removed: true });
  },
);
