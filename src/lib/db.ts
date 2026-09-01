import { PrismaClient } from "@prisma/client";

/**
 * Models carrying a nullable `deletedAt`. Read queries against them are
 * automatically constrained to non-deleted rows unless the caller mentions
 * `deletedAt` explicitly (the trash does, with `{ not: null }`).
 */
const SOFT_DELETE_MODELS = new Set([
  "Person",
  "Investigation",
  "Evidence",
  "Warrant",
  "Arrest",
]);
const GUARDED_READS = new Set([
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
]);

function mentionsDeletedAt(where: unknown): boolean {
  if (!where || typeof where !== "object") return false;
  const w = where as Record<string, unknown>;
  if ("deletedAt" in w) return true;
  for (const key of ["AND", "OR", "NOT"] as const) {
    const branch = w[key];
    if (Array.isArray(branch)) {
      if (branch.some(mentionsDeletedAt)) return true;
    } else if (branch && mentionsDeletedAt(branch)) {
      return true;
    }
  }
  return false;
}

function makeClient() {
  const base = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  return base.$extends({
    name: "soft-delete-read-guard",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (
            model &&
            SOFT_DELETE_MODELS.has(model) &&
            GUARDED_READS.has(operation)
          ) {
            const a = (args ?? {}) as { where?: Record<string, unknown> };
            if (!mentionsDeletedAt(a.where)) {
              a.where = { ...(a.where ?? {}), deletedAt: null };
            }
            return query(a);
          }
          return query(args);
        },
      },
    },
  });
}

type Client = ReturnType<typeof makeClient>;

const globalForPrisma = globalThis as unknown as { prisma?: Client };

export const prisma: Client = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
