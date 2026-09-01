import { prisma } from "./db";

const YEAR = () => new Date().getFullYear();

/**
 * Next number in a "<prefix><digits>" sequence, derived from the highest
 * numeric suffix actually present in the column — not a row count. A row
 * count drifts from reality the moment any row is ever hard-deleted (trash
 * purge, manual cleanup) while its number stays "used" by history; deriving
 * from MAX() can never reissue a number that's still on a live row.
 */
async function nextInSequence(table: string, column: string, prefix: string): Promise<number> {
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rows = await prisma.$queryRawUnsafe<{ max: number | null }[]>(
    `SELECT MAX(CAST(SUBSTRING("${column}" FROM '^${escaped}(\\d+)$') AS INTEGER)) AS max
     FROM "${table}" WHERE "${column}" ~ '^${escaped}\\d+$'`,
  );
  return Number(rows[0]?.max ?? 0) + 1;
}

export async function nextCaseNumber(): Promise<string> {
  const prefix = `FBI-${YEAR()}-`;
  const n = await nextInSequence("Investigation", "caseNumber", prefix);
  return `${prefix}${String(n).padStart(5, "0")}`;
}

export async function nextEvidenceNumber(): Promise<string> {
  const n = await nextInSequence("Evidence", "evidenceNumber", "E-");
  return `E-${Math.max(n, 1001)}`;
}

export async function nextWarrantNumber(): Promise<string> {
  const prefix = `W-${YEAR()}-`;
  const n = await nextInSequence("Warrant", "warrantNumber", prefix);
  return `${prefix}${String(n).padStart(4, "0")}`;
}

export async function nextTipPublicId(): Promise<string> {
  const prefix = `TIP-${YEAR()}-`;
  const n = await nextInSequence("Tip", "publicId", prefix);
  return `${prefix}${String(n).padStart(6, "0")}`;
}

export async function nextApplicationPublicId(): Promise<string> {
  const n = await nextInSequence("Application", "publicId", "APP-");
  return `APP-${String(n).padStart(4, "0")}`;
}

export async function nextMostWantedPublicId(): Promise<string> {
  const n = await nextInSequence("MostWanted", "publicId", "MW-");
  return `MW-${String(n).padStart(4, "0")}`;
}

export async function nextBadgeNumber(): Promise<string> {
  // Badges look like FBI-0042. Walk forward from the highest used number
  // until a free one is found (handles the rare concurrent-create race).
  let n = await nextInSequence("Agent", "badgeNumber", "FBI-");
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidate = `FBI-${String(n).padStart(4, "0")}`;
    const taken = await prisma.agent.findUnique({ where: { badgeNumber: candidate } });
    if (!taken) return candidate;
    n += 1;
  }
}

// Combining diacritical marks (U+0300–U+036F), built from code points so the
// source file contains no literal combining characters.
const DIACRITICS_RE = new RegExp(
  `[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`,
  "g",
);

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS_RE, "")
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
