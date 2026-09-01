import "server-only";
import type { Actor, Permission } from "./rbac";
import { canAny } from "./rbac";

/**
 * Soft deletes.
 *
 * `Person`, `Investigation` and `Evidence` carry a nullable `deletedAt`. Deleting
 * one only stamps that column; the row stays in the database, is hidden from
 * every list / detail / search query, and can be restored (or permanently
 * purged) from the trash by an agent who holds the matching `*.delete`
 * permission.
 */

/** Prisma `where` fragment that excludes soft-deleted rows. */
export const notDeleted = { deletedAt: null } as const;

/** The three permissions that also govern restore / purge in the trash. */
export const TRASH_PERMISSIONS: Permission[] = [
  "investigation.delete",
  "suspect.delete",
  "evidence.delete",
];

export function canUseTrash(actor: Actor | null | undefined): boolean {
  return canAny(actor, TRASH_PERMISSIONS);
}
