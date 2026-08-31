import { cn } from "@/lib/cn";

const TONES: Record<string, string> = {
  slate: "bg-navy-100 text-navy-700 ring-navy-200",
  blue: "bg-navy-50 text-navy-700 ring-navy-300",
  green: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  red: "bg-red-50 text-red-800 ring-red-200",
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
