import { prisma } from "./db";

const YEAR = () => new Date().getFullYear();

export async function nextCaseNumber(): Promise<string> {
  const count = await prisma.investigation.count();
  const seq = String(count + 1).padStart(5, "0");
  return `FIA-${YEAR()}-${seq}`;
}

export async function nextEvidenceNumber(): Promise<string> {
  const count = await prisma.evidence.count();
  return `E-${String(count + 1001)}`;
}

export async function nextWarrantNumber(): Promise<string> {
  const count = await prisma.warrant.count();
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

export function slugify(input: string): string {
  return input
    .toLowerCase()
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
