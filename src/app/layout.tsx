import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { themeInitScript } from "@/lib/theme";
import { AGENCY } from "@/lib/constants";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: `${AGENCY.name} — ${AGENCY.domain}`,
    template: `%s | ${AGENCY.abbr}`,
  },
  description:
    "Le Federal Bureau of Investigation (FBI) protège l'État de San Andreas et poursuit la justice dans toutes les juridictions. Portail officiel.",
  openGraph: {
    title: `${AGENCY.name}`,
    description: "Protéger San Andreas. Poursuivre la justice.",
    siteName: AGENCY.name,
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
