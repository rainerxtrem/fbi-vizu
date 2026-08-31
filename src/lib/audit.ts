import { prisma } from "./db";
import type { Actor } from "./rbac";
import { RANK_ABBR, type Rank } from "./rbac";

interface AuditInput {
  action: string;
  entityType?: string;
  entityId?: string;
  summary: string;
  meta?: Record<string, unknown>;
  ip?: string | null;
}

export function actorLabel(actor: Actor | null | undefined): string {
  if (!actor) return "anonymous";
  if (actor.agent) {
    return `${RANK_ABBR[actor.agent.rank as Rank]} ${actor.name} (${actor.agent.badgeNumber})`;
  }
  if (actor.isAdmin) return `Admin ${actor.name}`;
  return actor.name;
}

export async function audit(actor: Actor | null | undefined, input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: actor?.userId ?? null,
        actorLabel: actorLabel(actor),
        action: input.action,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        summary: input.summary,
        meta: (input.meta ?? undefined) as object | undefined,
        ip: input.ip ?? null,
      },
    });
  } catch (err) {
    // Never let audit failure break the primary operation.
    console.error("audit log failed:", err);
  }
}
