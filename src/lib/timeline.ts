import { prisma } from "./db";
import type { Actor } from "./rbac";

type TimelineType =
  | "INVESTIGATION_OPENED"
  | "INVESTIGATION_UPDATED"
  | "STATUS_CHANGED"
  | "NOTE_ADDED"
  | "EVIDENCE_ADDED"
  | "DOCUMENT_ADDED"
  | "PERSON_LINKED"
  | "WARRANT_REQUESTED"
  | "WARRANT_APPROVED"
  | "ARREST_MADE"
  | "AGENT_ASSIGNED"
  | "MOST_WANTED_CREATED"
  | "CUSTOM";

/**
 * Appends an event to an investigation's timeline. Called automatically by
 * agent actions (create evidence, add note, change status, ...).
 */
export async function addTimelineEvent(
  investigationId: string,
  type: TimelineType,
  message: string,
  actor?: Actor | null,
  occurredAt?: Date,
  meta?: Record<string, unknown>,
): Promise<void> {
  await prisma.timelineEvent.create({
    data: {
      investigationId,
      type,
      message,
      actorAgentId: actor?.agent?.id ?? null,
      occurredAt: occurredAt ?? new Date(),
      meta: (meta ?? undefined) as object | undefined,
    },
  });
  await prisma.investigation.update({
    where: { id: investigationId },
    data: { updatedAt: new Date() },
  });
}
