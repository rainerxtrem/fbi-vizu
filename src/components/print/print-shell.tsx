"use client";

import { useEffect } from "react";

/**
 * Chrome-free A4 document shell for printable / "save as PDF" pages.
 * The toolbar is hidden when printing; everything else is print-styled.
 */
export function PrintShell({
  title,
  reference,
  children,
  autoPrint,
}: {
  title: string;
  reference?: string;
  children: React.ReactNode;
  autoPrint?: boolean;
}) {
  useEffect(() => {
    if (autoPrint) {
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [autoPrint]);

  return (
    <div className="min-h-screen bg-navy-100 py-8 print:bg-white print:py-0">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { size: A4; margin: 18mm; }
          body { background: #fff; }
        }
      `}</style>

      <div className="no-print mx-auto mb-4 flex max-w-[210mm] items-center justify-between px-4">
        <button
          onClick={() => history.back()}
          className="text-sm font-semibold uppercase tracking-wide text-navy-600 hover:underline"
        >
          ← Retour
        </button>
        <button
          onClick={() => window.print()}
          className="rounded-md bg-navy-800 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white hover:bg-navy-900"
        >
          Imprimer / Enregistrer en PDF
        </button>
      </div>

      <div className="mx-auto max-w-[210mm] bg-white p-[18mm] text-[13px] leading-relaxed text-navy-900 shadow-lg print:max-w-none print:p-0 print:shadow-none">
        <header className="mb-6 flex items-start justify-between border-b-2 border-navy-900 pb-4">
          <div>
            <p className="text-lg font-black uppercase tracking-tight">
              Federal Bureau of Investigation
            </p>
            <p className="text-xs uppercase tracking-[0.2em] text-navy-500">
              Division de San Andreas · Document officiel
            </p>
          </div>
          {reference ? (
            <p className="text-right font-mono text-xs text-navy-500">{reference}</p>
          ) : null}
        </header>

        <h1 className="mb-4 text-xl font-bold uppercase">{title}</h1>
        {children}

        <footer className="mt-10 border-t border-navy-200 pt-3 text-[10px] text-navy-400">
          Document généré par le portail FBI le{" "}
          {new Date().toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })}. Usage
          officiel réservé — contient des informations d&apos;enquête potentiellement sensibles.
        </footer>
      </div>
    </div>
  );
}

export function DocGrid({ children }: { children: React.ReactNode }) {
  return <dl className="grid grid-cols-2 gap-x-6 gap-y-2">{children}</dl>;
}

export function DocField({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="border-b border-navy-100 pb-1">
      <dt className="text-[10px] uppercase tracking-wide text-navy-400">{label}</dt>
      <dd className="text-navy-900">{value || "—"}</dd>
    </div>
  );
}

export function DocSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-navy-700">{title}</h2>
      {children}
    </section>
  );
}
