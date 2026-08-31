import { redirect } from "next/navigation";
import { getActor } from "@/lib/auth";
import { can, type Permission } from "@/lib/rbac";
import { Sidebar, type NavItem } from "@/components/agent/sidebar";
import { AgentBadge } from "@/components/agent/agent-badge";
import { GlobalSearch } from "@/components/agent/global-search";
import { ConfirmProvider } from "@/components/ui/confirm";

export const dynamic = "force-dynamic";

const ALL_NAV: NavItem[] = [
  { href: "/agent", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/agent/investigations/mine", label: "My Investigations", icon: "FolderSearch" },
  { href: "/agent/investigations", label: "All Investigations", icon: "FolderSearch", perm: "investigation.view" },
  { href: "/agent/investigations/new", label: "Create Investigation", icon: "FolderPlus", perm: "investigation.create" },
  { href: "/agent/most-wanted", label: "Most Wanted", icon: "ShieldAlert", perm: "mostwanted.view" },
  { href: "/agent/suspects", label: "Suspects", icon: "UserSquare2", perm: "suspect.view" },
  { href: "/agent/news", label: "News", icon: "Newspaper", perm: "news.view" },
  { href: "/agent/applications", label: "Applications", icon: "ClipboardList", perm: "applications.view" },
  { href: "/agent/tips", label: "Tips", icon: "Inbox", perm: "tips.view" },
  { href: "/agent/agents", label: "Agents", icon: "UsersRound", perm: "agents.view" },
  { href: "/agent/activity", label: "Activity Logs", icon: "ScrollText", perm: "audit.view" },
  { href: "/agent/settings", label: "Settings", icon: "Settings" },
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
