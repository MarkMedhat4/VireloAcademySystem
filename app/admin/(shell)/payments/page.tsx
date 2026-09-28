import type { Metadata } from "next";
import { PaymentsView } from "@/components/dashboard/payments-view";
import { createServerSupabase } from "@/lib/supabase-server";
import type { Payment } from "@/lib/types";

export const metadata: Metadata = { title: "المدفوعات", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("payments")
    .select("id, student_name, student_phone, sender_number, grade, amount, paid, status, proof_path, created_at")
    .order("created_at", { ascending: false })
    .limit(5000);
  return <PaymentsView payments={(data ?? []) as Payment[]} />;
}
