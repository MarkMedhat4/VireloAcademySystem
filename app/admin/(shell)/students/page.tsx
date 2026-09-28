import type { Metadata } from "next";
import { StudentsView } from "@/components/dashboard/students-view";
import { createServerSupabase } from "@/lib/supabase-server";
import type { Student } from "@/lib/types";

export const metadata: Metadata = { title: "الطلاب", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminStudentsPage() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("students").select("*").order("created_at", { ascending: false }).limit(5000);
  return <StudentsView students={(data ?? []) as Student[]} />;
}
