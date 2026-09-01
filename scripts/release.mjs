// Runs on every Railway deploy before the app starts.
// 1. Sync the database schema (prisma db push — no migration files needed).
// 2. Seed demo data only when SEED_DATABASE === "true" AND the DB looks empty,
//    or when SEED_DATABASE === "force".
import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

function run(cmd) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

try {
  run("npx prisma db push --skip-generate --accept-data-loss");
} catch (e) {
  console.error("prisma db push failed", e);
  process.exit(1);
}

// Trigram indexes for the ILIKE '%…%' search paths, plus a light retention
// sweep on notifications. Best-effort — never block the deploy on these.
{
  const p = new PrismaClient();
  try {
    await p.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
    for (const [table, col] of [
      ["Person", "fullName"],
      ["Person", "alias"],
      ["Investigation", "title"],
      ["Investigation", "caseNumber"],
      ["Agent", "badgeNumber"],
    ]) {
      const idx = `idx_trgm_${table.toLowerCase()}_${col.toLowerCase()}`;
      await p.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "${idx}" ON "${table}" USING gin ("${col}" gin_trgm_ops)`,
      );
    }
    const cutoff = new Date(Date.now() - 60 * 24 * 3600 * 1000);
    const purged = await p.notification.deleteMany({
      where: { readAt: { not: null, lt: cutoff } },
    });
    if (purged.count) console.log(`Purged ${purged.count} old read notifications.`);
  } catch (e) {
    console.warn("post-push maintenance skipped:", e?.message ?? e);
  } finally {
    await p.$disconnect();
  }
}

const seedMode = process.env.SEED_DATABASE ?? "true";
if (seedMode === "false") {
  console.log("SEED_DATABASE=false — skipping seed.");
  process.exit(0);
}

const prisma = new PrismaClient();
try {
  const users = await prisma.user.count();
  if (seedMode === "force" || users === 0) {
    console.log(`Seeding database (mode=${seedMode}, existing users=${users})…`);
    run("npx tsx prisma/seed.ts");
  } else {
    console.log(`Database already has ${users} users — skipping seed. Set SEED_DATABASE=force to re-seed.`);
  }
} finally {
  await prisma.$disconnect();
}
