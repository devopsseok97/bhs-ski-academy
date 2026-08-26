import { isAdmin } from "@/lib/auth";
import LoginForm from "@/components/admin/LoginForm";
import AdminDashboard from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  return (await isAdmin()) ? <AdminDashboard /> : <LoginForm />;
}
