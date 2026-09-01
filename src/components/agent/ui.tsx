import Link from "next/link";
import { cn } from "@/lib/cn";

export function PageTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-navy-500">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  href,
  tone = "navy",
}: {
  label: string;
  value: React.ReactNode;
  href?: string;
  tone?: "navy" | "red" | "amber" | "green";
}) {
  const body = (
    <div className="rounded-lg border border-navy-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-navy-500">{label}</p>
      <p
        className={cn(
          "mt-2 text-3xl font-bold",
          tone === "navy" && "text-navy-900",
          tone === "red" && "text-federal-accent",
          tone === "amber" && "text-amber-600",
          tone === "green" && "text-emerald-600",
        )}
      >
        {value}
      </p>
    </div>
  );
  return href ? (
    <Link href={href} className="block transition hover:opacity-90">
      {body}
    </Link>
  ) : (
    body
  );
}

export function DataTable({
  head,
  children,
}: {
  head: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="-mx-4 overflow-x-auto rounded-lg border-y border-navy-200 bg-white sm:mx-0 sm:rounded-lg sm:border">
      <table className="w-full min-w-[680px] text-sm">
        <thead>
          <tr className="border-b border-navy-200 bg-navy-50 text-left text-xs uppercase tracking-wide text-navy-500">
            {head.map((h) => (
              <th key={h} className="whitespace-nowrap px-4 py-2.5 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-navy-100">{children}</tbody>
      </table>
    </div>
  );
}
