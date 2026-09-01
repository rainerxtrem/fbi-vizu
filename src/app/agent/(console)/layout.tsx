import { redirect } from "next/navigation";
import { getActor } from "@/lib/auth";
import { can, canAny, type Permission } from "@/lib/rbac";
import { Sidebar, type NavItem } from "@/components/agent/sidebar";
import { AgentBadge } from "@/components/agent/agent-badge";
import { GlobalSearch } from "@/components/agent/global-search";
import { ConfirmProvider } from "@/components/ui/confirm";

export const dynamic = "force-dynamic";

const ALL_NAV: NavItem[] = [
  { href: "/agent", label: "Tableau de bord", icon: "LayoutDashboard" },
  { href: "/agent/investigations/mine", label: "Mes enquêtes", icon: "FolderSearch" },
  { href: "/agent/investigations", label: "Toutes les enquêtes", icon: "FolderSearch", perm: "investigation.view" },
  { href: "/agent/investigations/new", label: "Créer une enquête", icon: "FolderPlus", perm: "investigation.create" },
  { href: "/agent/most-wanted", label: "Most Wanted", icon: "ShieldAlert", perm: "mostwanted.view" },
  { href: "/agent/suspects", label: "Suspects", icon: "UserSquare2", perm: "suspect.view" },
  { href: "/agent/news", label: "Actualités", icon: "Newspaper", perm: "news.view" },
  { href: "/agent/applications", label: "Candidatures", icon: "ClipboardList", perm: "applications.view" },
  { href: "/agent/tips", label: "Renseignements", icon: "Inbox", perm: "tips.view" },
  { href: "/agent/agents", label: "Agents", icon: "UsersRound", perm: "agents.view" },
  { href: "/agent/activity", label: "Journal d'activité", icon: "ScrollText", perm: "audit.view" },
  {
    href: "/agent/trash",
    label: "Corbeille",
    icon: "Trash2",
    anyPerm: ["investigation.delete", "suspect.delete", "evidence.delete"],
  },
  { href: "/agent/settings", label: "Paramètres", icon: "Settings" },
];

export default async function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await getActor();
  if (!actor) redirect("/agent/login");
  if (!actor.agent && !actor.isAdmin) redirect("/agent/login?error=not_an_agent");

  const nav = ALL_NAV.filter((n) => {
    if (n.anyPerm) return canAny(actor, n.anyPerm);
    if (!n.perm) return true;
    return can(actor, n.perm as Permission);
  });

  return (
    <ConfirmProvider>
      <div className="flex min-h-screen bg-navy-50/60">
        <Sidebar items={nav} agentName={actor.name} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-navy-200 bg-white px-4 py-3 lg:px-8">
            <GlobalSearch />
            <AgentBadge actor={actor} />
          </header>
          <main className="flex-1 p-4 lg:p-8">{children}</main>
        </div>
      </div>
    </ConfirmProvider>
  );
}
