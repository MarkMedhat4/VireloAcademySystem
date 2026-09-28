import { redirect } from "next/navigation";
import { AdminChrome } from "@/components/dashboard/admin-chrome";
import { getAdminContext } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * Guards every authenticated admin route (dashboard, students, payments, forms, settings,
 * attendance). Unauthenticated visitors are sent back to /admin — this check runs on the
 * server on every request, it is not just a UI redirect.
 */
export default async function AdminShellLayout({ children }: { children: React.ReactNode }) {
  const admin = isSupabaseConfigured() ? await getAdminContext() : null;
  if (!admin) redirect("/admin");

  return <AdminChrome admin={{ name: admin.fullName ?? admin.username ?? "Admin" }}>{children}</AdminChrome>;
}
