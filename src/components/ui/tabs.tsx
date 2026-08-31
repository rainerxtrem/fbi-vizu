"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export function Tabs({
  tabs,
}: {
  tabs: { id: string; label: string; count?: number; content: React.ReactNode }[];
}) {
  const [active, setActive] = useState(tabs[0]?.id);
  return (
    <div>
      <div className="flex flex-wrap gap-1 border-b border-navy-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 text-sm font-medium",
              active === t.id
                ? "border-navy-800 text-navy-900"
                : "border-transparent text-navy-500 hover:text-navy-800",
            )}
          >
            {t.label}
            {typeof t.count === "number" ? (
              <span className="ml-1.5 rounded-full bg-navy-100 px-1.5 text-xs text-navy-600">
                {t.count}
              </span>
            ) : null}
          </button>
        ))}
      </div>
      <div className="py-6">
        {tabs.map((t) => (
          <div key={t.id} hidden={active !== t.id}>
            {t.content}
          </div>
        ))}
      </div>
    </div>
  );
}
