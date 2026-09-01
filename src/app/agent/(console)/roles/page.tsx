import { requirePermission } from "@/lib/auth";
import { roleMatrix } from "@/lib/rbac-store";
import { PageTitle } from "@/components/agent/ui";
import { Breadcrumbs } from "@/components/ui/misc";
import { RolePermissionEditor } from "@/components/agent/role-permission-editor";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  await requirePermission("system.manage");
  const matrix = await roleMatrix();

  return (
    <div className="max-w-3xl">
      <Breadcrumbs items={[{ label: "Agents", href: "/agent/agents" }, { label: "Rôles et permissions" }]} />
      <PageTitle
        title="Rôles et permissions"
        subtitle="Ajuster, par grade, les permissions accordées — sans redéploiement"
      />
      <RolePermissionEditor matrix={matrix} />
    </div>
  );
}
