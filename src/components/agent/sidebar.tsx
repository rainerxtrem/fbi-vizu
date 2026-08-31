"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderSearch,
  FolderPlus,
  Users,
  UserSquare2,
  ShieldAlert,
  Package,
  FileText,
  Stamp,
  BarChart3,
  ClipboardList,
  Inbox,
  UsersRound,
  ScrollText,
  Settings,
  LogOut,
  Menu,
  X,
  Newspaper,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { Permission } from "@/lib/rbac";

export interface NavItem {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
  perm?: Permission;
}

const ICONS = {
  LayoutDashboard,
  FolderSearch,
  FolderPlus,
  Users,
  UserSquare2,
  ShieldAlert,
  Package,
  FileText,
  Stamp,
  BarChart3,
  ClipboardList,
  Inbox,
  UsersRound,
  ScrollText,
  Settings,
  Newspaper,
};

export function Sidebar({
  items,
  agentName,
}: {
  items: NavItem[];
  agentName: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/agent/login";
  }

  const nav = (
    <nav className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-4 text-white">
        <Shield className="h-6 w-6" />
        <div className="leading-tight">
          <p className="text-sm font-bold">FIA CONSOLE</p>
          <p className="text-[10px] uppercase tracking-widest text-navy-400">
            Investigative Portal
          </p>
        </div>
      </div>
      <div className="thin-scrollbar flex-1 overflow-y-auto px-2 py-2">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const active =
            item.href === "/agent"
              ? pathname === "/agent"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                active
                  ? "bg-navy-700 text-white"
                  : "text-navy-300 hover:bg-navy-800 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </div>
      <button
        onClick={logout}
        className="m-2 flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-navy-300 hover:bg-navy-800 hover:text-white"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-navy-200 bg-navy-950 px-4 py-3 text-white lg:hidden">
        <span className="flex items-center gap-2 text-sm font-bold">
          <Shield className="h-5 w-5" /> FIA CONSOLE
        </span>
        <button onClick={() => setOpen((s) => !s)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 bg-navy-950">{nav}</div>
        </div>
      ) : null}

      <aside className="hidden w-64 shrink-0 bg-navy-950 lg:block">
        <div className="sticky top-0 h-screen">{nav}</div>
      </aside>
    </>
  );
}
