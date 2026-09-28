import type { Metadata } from "next";
import { FormsListView } from "@/components/dashboard/forms-list-view";
import { listForms } from "@/app/admin/forms-actions";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = { title: "النماذج", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminFormsPage() {
  const res = await listForms();
  if (!res.ok) return <Alert variant="error">{res.message}</Alert>;
  return <FormsListView forms={res.data} />;
}
