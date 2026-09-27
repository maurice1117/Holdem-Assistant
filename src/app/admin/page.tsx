import { AdminPanel } from "@/components/admin/admin-panel";
import { isAdminRequestAuthenticated } from "@/lib/admin-request";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  return <AdminPanel initialAuthenticated={await isAdminRequestAuthenticated()} />;
}
