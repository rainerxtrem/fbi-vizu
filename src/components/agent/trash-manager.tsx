"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm";
import { formatDateTime } from "@/lib/format";

type Entity = "investigation" | "person" | "evidence";

interface TrashData {
  investigations: { id: string; caseNumber: string; title: string; deletedAt: string | null }[];
  persons: { id: string; fullName: string; alias: string | null; deletedAt: string | null }[];
  evidence: {
    id: string;
    evidenceNumber: string;
    title: string;
    deletedAt: string | null;
    caseNumber: string | null;
  }[];
}

export function TrashManager({
  data,
  caps,
}: {
  data: TrashData;
  caps: { investigation: boolean; person: boolean; evidence: boolean };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [busy, setBusy] = useState<string | null>(null);

  async function act(entity: Entity, id: string, action: "restore" | "purge", label: string) {
    if (action === "purge") {
      const ok = await confirm({
        title: `Supprimer définitivement « ${label} » ?`,
        message:
          "Cette action est irréversible. L'élément et ses données dépendantes seront effacés de la base.",
        confirmLabel: "Supprimer définitivement",
        danger: true,
      });
      if (!ok) return;
    }
    setBusy(id);
    const r = await fetch("/api/trash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity, id, action }),
    });
    const j = await r.json();
    setBusy(null);
    if (!r.ok) return toast("error", j.error ?? "Échec.");
    toast("success", action === "restore" ? "Élément restauré." : "Élément supprimé définitivement.");
    router.refresh();
  }

  const empty =
    data.investigations.length === 0 &&
    data.persons.length === 0 &&
    data.evidence.length === 0;

  if (empty) {
    return <p className="text-sm text-navy-500">La corbeille est vide.</p>;
  }

  const Row = ({
    id,
    primary,
    secondary,
    when,
    entity,
    label,
  }: {
    id: string;
    primary: string;
    secondary?: string | null;
    when: string | null;
    entity: Entity;
    label: string;
  }) => (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate font-medium text-navy-900">{primary}</p>
        <p className="text-xs text-navy-500">
          {secondary ? `${secondary} · ` : ""}
          supprimé le {when ? formatDateTime(when) : "—"}
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={busy === id}
          onClick={() => act(entity, id, "restore", label)}
        >
          Restaurer
        </Button>
        <Button
          size="sm"
          variant="danger"
          disabled={busy === id}
          onClick={() => act(entity, id, "purge", label)}
        >
          Supprimer déf.
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {caps.investigation && data.investigations.length > 0 ? (
        <Card>
          <CardHeader title="Enquêtes" description={`${data.investigations.length} dans la corbeille`} />
          <CardBody className="divide-y divide-navy-100 p-0">
            {data.investigations.map((i) => (
              <Row
                key={i.id}
                id={i.id}
                entity="investigation"
                primary={i.title}
                secondary={i.caseNumber}
                when={i.deletedAt}
                label={i.caseNumber}
              />
            ))}
          </CardBody>
        </Card>
      ) : null}

      {caps.person && data.persons.length > 0 ? (
        <Card>
          <CardHeader title="Fiches de personnes" description={`${data.persons.length} dans la corbeille`} />
          <CardBody className="divide-y divide-navy-100 p-0">
            {data.persons.map((p) => (
              <Row
                key={p.id}
                id={p.id}
                entity="person"
                primary={p.fullName}
                secondary={p.alias ? `« ${p.alias} »` : null}
                when={p.deletedAt}
                label={p.fullName}
              />
            ))}
          </CardBody>
        </Card>
      ) : null}

      {caps.evidence && data.evidence.length > 0 ? (
        <Card>
          <CardHeader title="Preuves" description={`${data.evidence.length} dans la corbeille`} />
          <CardBody className="divide-y divide-navy-100 p-0">
            {data.evidence.map((e) => (
              <Row
                key={e.id}
                id={e.id}
                entity="evidence"
                primary={e.title}
                secondary={`#${e.evidenceNumber}${e.caseNumber ? ` · ${e.caseNumber}` : ""}`}
                when={e.deletedAt}
                label={`#${e.evidenceNumber}`}
              />
            ))}
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
