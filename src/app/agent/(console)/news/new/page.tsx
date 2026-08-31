import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { PageTitle } from "@/components/agent/ui";
import { Breadcrumbs } from "@/components/ui/misc";
import { NewsForm } from "@/components/agent/news-form";

export default async function NewNewsPage() {
  const actor = await requirePermission("news.create");
  return (
    <div className="max-w-3xl">
      <Breadcrumbs items={[{ label: "Newsroom", href: "/agent/news" }, { label: "Create" }]} />
      <PageTitle title="Create News Article" />
      <NewsForm canPublish={can(actor, "news.publish")} />
    </div>
  );
}
