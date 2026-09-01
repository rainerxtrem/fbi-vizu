export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { handle, ok, fail } from "@/lib/api";
import { rankChangeSchema } from "@/lib/validation";
import { requireApiActor } from "@/lib/auth";
import { canChangeRank, rankLevel, RANK_LABELS, type Rank } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notify";

export const POST = handle(
  async (req: Request, { params }: { params: { id: string } }) => {
    const actor = await requireApiActor();
    if (!actor.agent) return fail("Réservé aux Agents.", 403);

    const { newRank, reason } = rankChangeSchema.parse(await req.json());
    const agent = await prisma.agent.findUnique({
      where: { id: params.id },
      include: { user: true },
    });
    if (!agent) return fail("Agent introuvable.", 404);
    if (agent.id === actor.agent.id) return fail("Vous ne pouvez pas modifier votre propre grade.", 403);

    const oldRank = agent.rank as Rank;
    if (oldRank === newRank) return fail("L'Agent détient déjà ce grade.", 400);

    if (!canChangeRank(actor, oldRank, newRank)) {
      return fail("Vous n'êtes pas autorisé à attribuer ce grade à cet Agent.", 403);
    }

    const promotion = rankLevel(newRank) > rankLevel(oldRank);

    await prisma.$transaction([
      prisma.agent.update({ where: { id: agent.id }, data: { rank: newRank } }),
      prisma.rankChange.create({
        data: {
          agentId: agent.id,
          oldRank,
          newRank,
          changedById: actor.agent.id,
          reason: reason ?? null,
        },
      }),
    ]);

    await audit(actor, {
      action: promotion ? "agent.promote" : "agent.demote",
      entityType: "agent",
      entityId: agent.id,
      summary: `${actor.name} a ${promotion ? "promu" : "rétrogradé"} ${agent.user.name} de ${
        RANK_LABELS[oldRank]
      } à ${RANK_LABELS[newRank]}`,
      meta: { oldRank, newRank, reason },
    });

    await notify([agent.id], {
      type: "RANK_CHANGED",
      title: promotion ? "Vous avez été promu" : "Changement de grade",
      body: `${RANK_LABELS[oldRank]} → ${RANK_LABELS[newRank]}${reason ? ` — ${reason}` : ""}`,
      linkUrl: "/agent/settings",
    });

    return ok({ oldRank, newRank });
  },
);
