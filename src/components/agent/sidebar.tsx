"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderSearch,
  Folders,
  UserSquare2,
  ShieldAlert,
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
  Trash2,
  Bell,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { Permission } from "@/lib/rbac";
import { Emblem } from "@/components/brand/emblem";

export interface NavItem {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
  perm?: Permission;
  anyPerm?: Permission[];
}

export interface NavSection {
  /** A discreet uppercase header. Omit for the top / bottom blocks. */
  title?: string;
  items: NavItem[];
}

const ICONS = {
  LayoutDashboard,
  FolderSearch,
  Folders,
  UserSquare2,
  ShieldAlert,
  BarChart3,
  ClipboardList,
  Inbox,
  UsersRound,
  ScrollText,
  Settings,
  Newspaper,
  Trash2,
  Bell,
  SlidersHorizontal,
};

export function Sidebar({
  sections,
}: {
  sections: NavSection[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/agent/login";
  }

  // Highlight the single deepest nav link that prefixes the current path, so
  // "Toutes les enquêtes" doesn't light up while you're on "Mes enquêtes".
  const activeHref = sections
    .flatMap((s) => s.items.map((i) => i.href))
    .filter((h) =>
      h === "/agent" ? pathname === "/agent" : pathname === h || pathname.startsWith(h + "/"),
    )
    .sort((a, b) => b.length - a.length)[0];

  // The console shell chrome stays dark in both themes.
  const nav = (
    <nav className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-4 text-[#ffffff]">
        <Emblem size={30} />
        <div className="leading-tight">
          <p className="text-sm font-bold">CONSOLE FBI</p>
          <p className="text-[10px] uppercase tracking-widest text-[#6b7c98]">
            Portail d&apos;enquête
          </p>
        </div>
      </div>
      <div className="thin-scrollbar flex-1 overflow-y-auto px-2 py-2">
        {sections.map((section, si) => (
          <div
            key={si}
            className={cn(
              "space-y-0.5",
              si > 0 && "mt-2 border-t border-[#1b2b47] pt-2",
            )}
          >
            {section.title ? (
              <p className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-[#6b7c98]">
                {section.title}
              </p>
            ) : null}
            {section.items.map((item) => {
              const Icon = ICONS[item.icon];
              const active = item.href === activeHref;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                    active
                      ? "bg-[#1e2f4f] text-[#ffffff]"
                      : "text-[#9fb0c8] hover:bg-[#16223c] hover:text-[#ffffff]",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
      <button
        onClick={logout}
        className="m-2 flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-[#9fb0c8] hover:bg-[#16223c] hover:text-[#ffffff]"
      >
        <LogOut className="h-4 w-4" />
        Déconnexion
      </button>
    </nav>
  );

  return (
    <>
      {/* Barre supérieure mobile */}
      <div className="flex items-center justify-between border-b border-navy-200 bg-[#0a1428] px-4 py-3 text-[#ffffff] lg:hidden">
        <span className="flex items-center gap-2 text-sm font-bold">
          <Emblem size={22} /> CONSOLE FBI
        </span>
        <button onClick={() => setOpen((s) => !s)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 bg-[#0a1428]">{nav}</div>
        </div>
      ) : null}

      <aside className="hidden w-64 shrink-0 bg-[#0a1428] lg:block">
        <div className="sticky top-0 h-screen">{nav}</div>
      </aside>
    </>
  );
}
