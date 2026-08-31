import { Breadcrumbs } from "@/components/ui/misc";

export function PageHeader({
  title,
  intro,
  crumbs,
}: {
  title: string;
  intro?: string;
  crumbs: { label: string; href?: string }[];
}) {
  return (
    <div className="border-b border-navy-200 bg-navy-900 text-white">
      <div className="container-fia py-12">
        <Breadcrumbs items={crumbs} />
        <h1 className="mt-3 text-4xl font-bold">{title}</h1>
        {intro ? <p className="mt-2 max-w-2xl text-navy-200">{intro}</p> : null}
      </div>
    </div>
  );
}
