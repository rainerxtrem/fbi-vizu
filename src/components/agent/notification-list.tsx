"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";

interface Item {
  id: string;
  title: string;
  body: string | null;
  linkUrl: string | null;
  readAt: string | null;
  createdAt: string;
}

export function NotificationList({ items }: { items: Item[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(items);

  async function markAll() {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setRows((r) => r.map((x) => ({ ...x, readAt: x.readAt ?? new Date().toISOString() })));
    router.refresh();
  }

  async function open(it: Item) {
    if (!it.readAt) {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: it.id }),
      });
    }
    if (it.linkUrl) router.push(it.linkUrl);
    else router.refresh();
  }

  const hasUnread = rows.some((r) => !r.readAt);

  return (
    <div className="space-y-3">
      {hasUnread ? (
        <Button size="sm" variant="secondary" onClick={markAll}>
          Tout marquer comme lu
        </Button>
      ) : null}
      <div className="divide-y divide-navy-100 rounded-lg border border-navy-200 bg-white">
        {rows.map((n) => (
          <button
            key={n.id}
            onClick={() => open(n)}
            className={`block w-full px-4 py-3 text-left hover:bg-navy-50 ${
              n.readAt ? "" : "bg-navy-50/60"
            }`}
          >
            <p className="flex items-center gap-2 text-sm font-medium text-navy-900">
              {n.readAt ? null : (
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-federal-accent" />
              )}
              {n.title}
            </p>
            {n.body ? <p className="mt-0.5 text-sm text-navy-600">{n.body}</p> : null}
            <p className="mt-0.5 text-xs text-navy-400">{formatDateTime(n.createdAt)}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
