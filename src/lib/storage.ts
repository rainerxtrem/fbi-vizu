import "server-only";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { prisma } from "./db";
import type { Actor } from "./rbac";

/**
 * File storage.
 *
 * Default implementation: local filesystem under /public/uploads, which on
 * Railway should be backed by a persistent volume mounted at
 * `/app/public/uploads` (see railway.json / README).
 *
 * To use S3-compatible storage instead, set S3_* env vars and implement
 * putObject() below — the rest of the app only depends on the returned URL.
 */

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "video/mp4",
  "video/quicktime",
  "audio/mpeg",
  "audio/wav",
  "audio/mp4",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export interface StoredFile {
  id: string;
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export async function storeUpload(
  file: File,
  actor: Actor | null,
  description?: string,
): Promise<StoredFile> {
  if (file.size > MAX_BYTES) {
    throw new Error(`Le fichier dépasse la limite de ${MAX_BYTES / 1024 / 1024} Mo.`);
  }
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error(`Type de fichier non pris en charge : ${file.type || "inconnu"}`);
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name).toLowerCase().replace(/[^.a-z0-9]/g, "").slice(0, 12);
  const key = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, key), buf);

  const url = `/uploads/${key}`;
  const record = await prisma.fileAsset.create({
    data: {
      filename: key,
      originalName: file.name.slice(0, 255),
      mimeType: file.type,
      size: file.size,
      url,
      description: description ?? null,
      uploadedById: actor?.agent?.id ?? null,
    },
  });

  return {
    id: record.id,
    url,
    originalName: record.originalName,
    mimeType: record.mimeType,
    size: record.size,
  };
}
