"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell } from "lucide-react";
import { relativeTime } from "@/lib/format";

interface Notif {
  id: string;
  type: string;
  title: string;
  body: string | null;
  linkUrl: string | null;
  readAt: string | null;
  createdAt: string;
}

export function NotificationBell() {
  const router = useRouter();
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/notifications");
      const j = await r.json();
      if (j.ok) {
        setItems(j.data.notifications);
        setUnread(j.data.unread);
      }
    } catch {
      /* ignore transient errors */
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 45_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function markAll() {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    load();
  }

  async function openItem(n: Notif) {
    if (!n.readAt) {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: n.id }),
      });
    }
    setOpen(false);
    if (n.linkUrl) router.push(n.linkUrl);
    load();
  }

  return (
    <div ref={boxRef} className="relative">
      <button
        onClick={() => setOpen((s) => !s)}
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-navy-500 hover:bg-navy-100"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-federal-accent px-1 text-[10px] font-bold text-on-accent">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-1 w-80 overflow-hidden rounded-md border border-navy-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-navy-100 px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-navy-500">
              Notifications
            </span>
            {unread > 0 ? (
              <button onClick={markAll} className="text-xs text-navy-600 hover:underline">
                Tout marquer comme lu
              </button>
            ) : null}
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-navy-500">Aucune notification.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => openItem(n)}
                  className={`block w-full border-b border-navy-100 px-3 py-2.5 text-left last:border-0 hover:bg-navy-50 ${
                    n.readAt ? "" : "bg-navy-50/60"
                  }`}
                >
                  <p className="flex items-center gap-2 text-sm font-medium text-navy-900">
                    {n.readAt ? null : (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-federal-accent" />
                    )}
                    {n.title}
                  </p>
                  {n.body ? <p className="mt-0.5 text-xs text-navy-600">{n.body}</p> : null}
                  <p className="mt-0.5 text-[11px] text-navy-400">{relativeTime(n.createdAt)}</p>
                </button>
              ))
            )}
          </div>
          <Link
            href="/agent/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-navy-100 px-3 py-2 text-center text-xs font-semibold uppercase text-navy-600 hover:bg-navy-50"
          >
            Tout voir
          </Link>
        </div>
      ) : null}
    </div>
  );
}
