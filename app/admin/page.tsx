import { requireAdmin } from "../../lib/admin-auth";
import { AdminWorkspace } from "./admin-workspace";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await requireAdmin();
  return <AdminWorkspace adminName={admin.name ?? "Administratrice"}/>;
}
