import { redirect } from "next/navigation";
import { getActor } from "@/lib/auth";
import { can, canAny, type Permission } from "@/lib/rbac";
import { Sidebar, type NavSection } from "@/components/agent/sidebar";
import { AgentBadge } from "@/components/agent/agent-badge";
import { GlobalSearch } from "@/components/agent/global-search";
import { NotificationBell } from "@/components/agent/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { ConfirmProvider } from "@/components/ui/confirm";

export const dynamic = "force-dynamic";

// Grouped navigation. "Créer une enquête" lives only as the CTA at the top of
// "Toutes les enquêtes", not here.
const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { href: "/agent", label: "Tableau de bord", icon: "LayoutDashboard" },
      { href: "/agent/notifications", label: "Notifications", icon: "Bell" },
    ],
  },
  {
    title: "Enquêtes",
    items: [
      { href: "/agent/investigations/mine", label: "Mes enquêtes", icon: "FolderSearch" },
      { href: "/agent/investigations", label: "Toutes les enquêtes", icon: "Folders", perm: "investigation.view" },
      { href: "/agent/suspects", label: "Suspects", icon: "UserSquare2", perm: "suspect.view" },
      { href: "/agent/most-wanted", label: "Most Wanted", icon: "ShieldAlert", perm: "mostwanted.view" },
    ],
  },
  {
    title: "Public & renseignement",
    items: [
      { href: "/agent/tips", label: "Renseignements", icon: "Inbox", perm: "tips.view" },
      { href: "/agent/applications", label: "Candidatures", icon: "ClipboardList", perm: "applications.view" },
      { href: "/agent/news", label: "Actualités", icon: "Newspaper", perm: "news.view" },
    ],
  },
  {
    title: "Administration",
    items: [
      { href: "/agent/reports", label: "Rapports", icon: "BarChart3", perm: "reports.view" },
      { href: "/agent/agents", label: "Agents", icon: "UsersRound", perm: "agents.view" },
      { href: "/agent/roles", label: "Rôles et permissions", icon: "SlidersHorizontal", perm: "system.manage" },
      { href: "/agent/activity", label: "Journal d'activité", icon: "ScrollText", perm: "audit.view" },
      {
        href: "/agent/trash",
        label: "Corbeille",
        icon: "Trash2",
        anyPerm: [
          "investigation.delete",
          "suspect.delete",
          "evidence.delete",
          "warrant.delete",
          "arrest.delete",
        ],
      },
    ],
  },
  {
    items: [{ href: "/agent/settings", label: "Paramètres", icon: "Settings" }],
  },
];

export default async function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await getActor();
  if (!actor) redirect("/agent/login");
  if (!actor.agent && !actor.isAdmin) redirect("/agent/login?error=not_an_agent");

  const visible = (n: { perm?: string; anyPerm?: Permission[] }) => {
    if (n.anyPerm) return canAny(actor, n.anyPerm);
    if (!n.perm) return true;
    return can(actor, n.perm as Permission);
  };
  const sections = NAV_SECTIONS.map((s) => ({
    ...s,
    items: s.items.filter(visible),
  })).filter((s) => s.items.length > 0);

  return (
    <ConfirmProvider>
      <div className="flex min-h-screen bg-navy-50/60">
        <Sidebar sections={sections} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-navy-200 bg-white px-4 py-3 lg:px-8">
            <GlobalSearch />
            <div className="flex items-center gap-2">
              <ThemeToggle />
              {actor.agent ? <NotificationBell /> : null}
              <AgentBadge actor={actor} />
            </div>
          </header>
          <main className="flex-1 p-4 lg:p-8">{children}</main>
        </div>
      </div>
    </ConfirmProvider>
  );
}
