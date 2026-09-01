import Link from "next/link";
import { requireAgent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageTitle } from "@/components/agent/ui";
import { EmptyState } from "@/components/ui/misc";
import { NotificationList } from "@/components/agent/notification-list";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const actor = await requireAgent();

  if (!actor.agent) {
    return (
      <div>
        <PageTitle title="Notifications" />
        <EmptyState title="Les notifications sont réservées aux agents." />
      </div>
    );
  }

  const notifications = await prisma.notification.findMany({
    where: { agentId: actor.agent.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="max-w-3xl">
      <PageTitle
        title="Notifications"
        subtitle={`${notifications.filter((n) => !n.readAt).length} non lue(s)`}
      />
      {notifications.length === 0 ? (
        <EmptyState
          title="Aucune notification"
          description="Vous serez prévenu ici des affectations, mandats et arrestations vous concernant."
        />
      ) : (
        <NotificationList
          items={notifications.map((n) => ({
            id: n.id,
            title: n.title,
            body: n.body,
            linkUrl: n.linkUrl,
            readAt: n.readAt ? n.readAt.toISOString() : null,
            createdAt: n.createdAt.toISOString(),
          }))}
        />
      )}
      <p className="mt-4 text-xs text-navy-400">
        <Link href="/agent" className="hover:underline">
          Retour au tableau de bord
        </Link>
      </p>
    </div>
  );
}
