import { cn } from "@/lib/cn";

const TONES: Record<string, string> = {
  // slate/blue ride the navy scale, so they flip with the theme automatically
  slate: "bg-navy-100 text-navy-700 ring-navy-200",
  blue: "bg-navy-100 text-navy-800 ring-navy-300",
  green:
    "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/25",
  amber:
    "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/25",
  red: "bg-red-50 text-red-800 ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/25",
};

export function Badge({
  children,
  tone = "slate",
  className,
}: {
  children: React.ReactNode;
  tone?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium uppercase tracking-wide ring-1 ring-inset",
        TONES[tone] ?? TONES.slate,
        className,
      )}
    >
      {children}
    </span>
  );
}
