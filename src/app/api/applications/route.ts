export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { handle, ok, created, assertRateLimit, clientIp, pageParams } from "@/lib/api";
import { applicationSchema } from "@/lib/validation";
import { nextApplicationPublicId } from "@/lib/ids";
import { requireApiPermission } from "@/lib/auth";
import { audit } from "@/lib/audit";

export const POST = handle(async (req: Request) => {
  assertRateLimit(req, "application", 4, 300_000);
  const d = applicationSchema.parse(await req.json());

  const publicId = await nextApplicationPublicId();
  const app = await prisma.application.create({
    data: {
      publicId,
      firstName: d.firstName,
      lastName: d.lastName,
      dob: d.dob ? new Date(d.dob) : null,
      phone: d.phone,
      email: d.email,
      address: d.address ?? null,
      city: d.city ?? null,
      state: d.state ?? null,
      zip: d.zip ?? null,
      currentOccupation: d.currentOccupation ?? null,
      priorLeExperience: d.priorLeExperience ?? null,
      militaryExperience: d.militaryExperience ?? null,
      education: d.education ?? null,
      certifications: d.certifications ?? null,
      position: d.position,
      whyJoin: d.whyJoin ?? null,
      whyGoodCandidate: d.whyGoodCandidate ?? null,
      difficultDecision: d.difficultDecision ?? null,
      pressureExperience: d.pressureExperience ?? null,
      resumeUrl: d.resumeUrl ?? null,
      idUrl: d.idUrl ?? null,
      certUrl: d.certUrl ?? null,
      additionalUrl: d.additionalUrl ?? null,
      certified: d.certified,
      status: "SUBMITTED",
    },
  });

  await audit(null, {
    action: "application.submitted",
    entityType: "application",
    entityId: app.id,
    summary: `Candidature ${publicId} soumise par ${d.firstName} ${d.lastName} (${d.position})`,
    ip: clientIp(req),
  });

  return created({ publicId: app.publicId, id: app.id });
});

export const GET = handle(async (req: Request) => {
  await requireApiPermission("applications.view");
  const url = new URL(req.url);
  const { skip, take, page, pageSize } = pageParams(url, 20);
  const status = url.searchParams.get("status");

  const where = status ? { status: status as never } : {};
  const [total, applications] = await Promise.all([
    prisma.application.count({ where }),
    prisma.application.findMany({
      where,
      include: { assignedRecruiter: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
  ]);

  return ok({ applications, total, page, pageSize });
});
