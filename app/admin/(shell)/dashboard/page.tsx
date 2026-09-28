import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { createServerSupabase } from "@/lib/supabase-server";
import { listForms, listRecentResponses } from "@/app/admin/forms-actions";
import type { Payment, Student } from "@/lib/types";

export const metadata: Metadata = { title: "لوحة التحكم", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
const ROW_CAP = 5000;

export default async function AdminDashboardPage() {
  const supabase = await createServerSupabase();
  const [studentsRes, paymentsRes, formsRes, responsesRes] = await Promise.all([
    supabase.from("students").select("*").order("created_at", { ascending: false }).limit(ROW_CAP),
    supabase
      .from("payments")
      .select("id, student_name, student_phone, sender_number, grade, amount, paid, status, proof_path, created_at")
      .order("created_at", { ascending: false })
      .limit(ROW_CAP),
    listForms(),
    listRecentResponses(5),
  ]);

  return (
    <DashboardView
      students={(studentsRes.data ?? []) as Student[]}
      payments={(paymentsRes.data ?? []) as Payment[]}
      forms={formsRes.ok ? formsRes.data : []}
      recentResponses={responsesRes.ok ? responsesRes.data : []}
    />
  );
}
