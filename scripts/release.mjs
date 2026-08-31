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
