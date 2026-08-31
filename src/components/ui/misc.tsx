import Link from "next/link";
import { ChevronRight, Inbox } from "lucide-react";
import { cn } from "@/lib/cn";

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Inbox,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-navy-200 bg-navy-50/50 px-6 py-14 text-center">
      <Icon className="h-8 w-8 text-navy-300" />
      <h3 className="mt-3 text-sm font-semibold text-navy-800">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-navy-500">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Breadcrumbs({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav className="flex items-center gap-1 text-xs text-navy-500" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {item.href ? (
            <Link href={item.href} className="hover:text-navy-800">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-navy-800">{item.label}</span>
          )}
          {i < items.length - 1 ? <ChevronRight className="h-3 w-3" /> : null}
        </span>
      ))}
    </nav>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded", className)} />;
}

export function Pagination({
  page,
  totalPages,
  makeHref,
}: {
  page: number;
  totalPages: number;
  makeHref: (p: number) => string;
}) {
  if (totalPages <= 1) return null;
  const pages = pageWindow(page, totalPages);
  return (
    <div className="flex items-center justify-center gap-1 text-sm">
      <PageLink href={makeHref(Math.max(1, page - 1))} disabled={page === 1}>
        Prev
      </PageLink>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={i} className="px-2 text-navy-400">
            …
          </span>
        ) : (
          <PageLink key={i} href={makeHref(p)} active={p === page}>
            {p}
          </PageLink>
        ),
      )}
      <PageLink href={makeHref(Math.min(totalPages, page + 1))} disabled={page === totalPages}>
        Next
      </PageLink>
    </div>
  );
}

function PageLink({
  href,
  children,
  active,
  disabled,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <span className="cursor-not-allowed rounded border border-navy-100 px-3 py-1.5 text-navy-300">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className={cn(
        "rounded border px-3 py-1.5",
        active
          ? "border-navy-800 bg-navy-800 text-white"
          : "border-navy-200 text-navy-700 hover:bg-navy-50",
      )}
    >
      {children}
    </Link>
  );
}

function pageWindow(page: number, total: number): (number | "...")[] {
  const out: (number | "...")[] = [];
  const push = (n: number | "...") => out.push(n);
  const range = 1;
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= page - range && i <= page + range)) {
      push(i);
    } else if (out[out.length - 1] !== "...") {
      push("...");
    }
  }
  return out;
}
