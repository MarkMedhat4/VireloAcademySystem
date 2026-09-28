import type { Metadata } from "next";
import { Alert } from "@/components/ui/alert";
import { FormBuilder } from "@/components/dashboard/form-builder/form-builder";
import { getFormWithFields } from "@/app/admin/forms-actions";

export const metadata: Metadata = { title: "تعديل النموذج", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminEditFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getFormWithFields(id);
  if (!res.ok) return <Alert variant="error">{res.message}</Alert>;
  return <FormBuilder mode="edit" initialForm={res.data.form} initialFields={res.data.fields} />;
}
