import { prisma } from "./db";

const YEAR = () => new Date().getFullYear();

/**
 * Row count that ignores the soft-delete read guard — sequence numbers must
 * keep advancing past deleted rows so they never collide.
 */
async function totalRows(table: string): Promise<number> {
  const rows = await prisma.$queryRawUnsafe<{ c: bigint }[]>(
    `SELECT COUNT(*)::bigint AS c FROM "${table}"`,
  );
  return Number(rows[0]?.c ?? 0);
}

export async function nextCaseNumber(): Promise<string> {
  const count = await totalRows("Investigation");
  const seq = String(count + 1).padStart(5, "0");
  return `FBI-${YEAR()}-${seq}`;
}

export async function nextEvidenceNumber(): Promise<string> {
  const count = await totalRows("Evidence");
  return `E-${String(count + 1001)}`;
}

export async function nextWarrantNumber(): Promise<string> {
  const count = await totalRows("Warrant");
  return `W-${YEAR()}-${String(count + 1).padStart(4, "0")}`;
}

export async function nextTipPublicId(): Promise<string> {
  const count = await prisma.tip.count();
  return `TIP-${YEAR()}-${String(count + 1).padStart(6, "0")}`;
}

export async function nextApplicationPublicId(): Promise<string> {
  const count = await prisma.application.count();
  return `APP-${String(count + 1).padStart(4, "0")}`;
}

export async function nextMostWantedPublicId(): Promise<string> {
  const count = await prisma.mostWanted.count();
  return `MW-${String(count + 1).padStart(4, "0")}`;
}

export async function nextBadgeNumber(): Promise<string> {
  // Badges look like FBI-0042. Walk forward from the current count until free.
  let n = (await prisma.agent.count()) + 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidate = `FBI-${String(n).padStart(4, "0")}`;
    const taken = await prisma.agent.findUnique({ where: { badgeNumber: candidate } });
    if (!taken) return candidate;
    n += 1;
  }
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export async function uniqueNewsSlug(title: string): Promise<string> {
  const base = slugify(title) || "article";
  let slug = base;
  let i = 2;
  while (await prisma.news.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`;
  }
  return slug;
}
