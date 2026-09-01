import { prisma } from "./db";
import { log } from "./log";

export type NotificationType =
  | "CASE_ASSIGNED"
  | "WARRANT_APPROVED"
  | "WARRANT_DENIED"
  | "ARREST_MADE"
  | "RANK_CHANGED"
  | "TIP_ASSIGNED";

interface NotifyInput {
  type: NotificationType;
  title: string;
  body?: string;
  linkUrl?: string;
}

/**
 * Fan-out an in-app notification to one or more agents. Never throws — a failed
 * notification must not break the action that triggered it.
 */
export async function notify(
  agentIds: (string | null | undefined)[],
  input: NotifyInput,
): Promise<void> {
  const ids = Array.from(new Set(agentIds.filter((x): x is string => !!x)));
  if (ids.length === 0) return;
  try {
    await prisma.notification.createMany({
      data: ids.map((agentId) => ({
        agentId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        linkUrl: input.linkUrl ?? null,
      })),
    });
  } catch (err) {
    log.warn("notify.failed", { type: input.type, count: ids.length }, err);
  }
}
