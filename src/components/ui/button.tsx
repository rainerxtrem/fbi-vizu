import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-navy-800 text-white hover:bg-navy-900 focus-visible:ring-navy-300 border border-transparent",
  secondary:
    "bg-white text-navy-800 hover:bg-navy-50 border border-navy-300 focus-visible:ring-navy-200",
  outline:
    "bg-transparent text-white hover:bg-white/10 border border-white/40 focus-visible:ring-white/30",
  ghost: "bg-transparent text-navy-700 hover:bg-navy-100 border border-transparent",
  danger:
    "bg-federal-accent text-white hover:bg-red-800 border border-transparent focus-visible:ring-red-300",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60";

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn(base, VARIANTS[variant], SIZES[size], className)} {...props}>
      {props.children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  href,
  children,
  ...rest
}: CommonProps & { href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <Link href={href} className={cn(base, VARIANTS[variant], SIZES[size], className)} {...rest}>
      {children}
    </Link>
  );
}
