import Link from "next/link";
import { Shield } from "lucide-react";
import { AGENCY } from "@/lib/constants";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy-950 px-4 text-center text-white">
      <Shield className="h-10 w-10 text-navy-400" />
      <p className="mt-6 text-6xl font-bold">404</p>
      <p className="mt-3 text-lg text-navy-200">
        The page you are looking for could not be found.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-md bg-white px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-navy-900 hover:bg-navy-100"
      >
        Return to {AGENCY.domain}
      </Link>
    </div>
  );
}
