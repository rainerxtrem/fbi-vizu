export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { handle, ok, fail } from "@/lib/api";
import { rankChangeSchema } from "@/lib/validation";
import { requireApiActor } from "@/lib/auth";
import { canChangeRank, rankLevel, RANK_LABELS, type Rank } from "@/lib/rbac";
import { audit } from "@/lib/audit";

export const POST = handle(
  async (req: Request, { params }: { params: { id: string } }) => {
    const actor = await requireApiActor();
    if (!actor.agent) return fail("Agents only.", 403);

    const { newRank, reason } = rankChangeSchema.parse(await req.json());
    const agent = await prisma.agent.findUnique({
      where: { id: params.id },
      include: { user: true },
    });
    if (!agent) return fail("Agent not found.", 404);
    if (agent.id === actor.agent.id) return fail("You cannot change your own rank.", 403);

    const oldRank = agent.rank as Rank;
    if (oldRank === newRank) return fail("Agent already holds that rank.", 400);

    if (!canChangeRank(actor, oldRank, newRank)) {
      return fail("You are not authorized to set this rank for this agent.", 403);
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
      summary: `${actor.name} ${promotion ? "promoted" : "demoted"} ${agent.user.name} from ${
        RANK_LABELS[oldRank]
      } to ${RANK_LABELS[newRank]}`,
      meta: { oldRank, newRank, reason },
    });

    return ok({ oldRank, newRank });
  },
);
