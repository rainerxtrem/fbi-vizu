import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { AGENCY } from "@/lib/constants";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: `${AGENCY.name} — ${AGENCY.domain}`,
    template: `%s | ${AGENCY.abbr}`,
  },
  description:
    "The Federal Investigative Agency (FIA) protects the State of San Andreas and pursues justice across every jurisdiction. Official portal.",
  openGraph: {
    title: `${AGENCY.name}`,
    description: "Protecting San Andreas. Pursuing Justice.",
    siteName: AGENCY.name,
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
