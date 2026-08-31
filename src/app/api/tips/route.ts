import { prisma } from "@/lib/db";
import { handle, ok, created, assertRateLimit, clientIp, pageParams } from "@/lib/api";
import { tipSchema } from "@/lib/validation";
import { nextTipPublicId } from "@/lib/ids";
import { getActor, requireApiPermission } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { can } from "@/lib/rbac";

// Public: submit a tip
export const POST = handle(async (req: Request) => {
  assertRateLimit(req, "tip", 6, 60_000);
  const data = tipSchema.parse(await req.json());

  const publicId = await nextTipPublicId();
  let fileId: string | undefined;
  if (data.fileUrl) {
    const asset = await prisma.fileAsset.findFirst({ where: { url: data.fileUrl } });
    fileId = asset?.id;
  }

  const tip = await prisma.tip.create({
    data: {
      publicId,
      subject: data.subject,
      description: data.description,
      location: data.location ?? null,
      incidentDate: data.incidentDate ? new Date(data.incidentDate) : null,
      anonymous: data.anonymous,
      name: data.anonymous ? null : data.name ?? null,
      email: data.anonymous ? null : data.email ?? null,
      phone: data.anonymous ? null : data.phone ?? null,
      mostWantedId: data.mostWantedId || null,
      fileId: fileId ?? null,
    },
  });

  await audit(null, {
    action: "tip.submitted",
    entityType: "tip",
    entityId: tip.id,
    summary: `Public tip ${publicId} submitted${data.anonymous ? " (anonymous)" : ""}`,
    ip: clientIp(req),
  });

  return created({ publicId: tip.publicId, id: tip.id });
});

// Agent: list tips
export const GET = handle(async (req: Request) => {
  const actor = await requireApiPermission("tips.view");
  const url = new URL(req.url);
  const { skip, take, page, pageSize } = pageParams(url, 20);
  const status = url.searchParams.get("status");
  const q = url.searchParams.get("q")?.trim();

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { subject: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { publicId: { contains: q, mode: "insensitive" } },
    ];
  }
  // Agents without tips.view.all only see tips tied to their cases or assigned to them
  if (!can(actor, "tips.view.all")) {
    where.OR = [
      { assignedToId: actor.agent?.id ?? "__none__" },
      { investigation: { leadAgentId: actor.agent?.id ?? "__none__" } },
      { investigation: { assignedAgents: { some: { agentId: actor.agent?.id ?? "__none__" } } } },
    ];
  }

  const [total, tips] = await Promise.all([
    prisma.tip.count({ where }),
    prisma.tip.findMany({
      where,
      include: { mostWanted: true, assignedTo: { include: { user: true } }, investigation: true, file: true },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
  ]);

  return ok({ tips, total, page, pageSize });
});
