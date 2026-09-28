import type { Metadata } from "next";
import { FormBuilder } from "@/components/dashboard/form-builder/form-builder";

export const metadata: Metadata = { title: "إنشاء نموذج", robots: { index: false, follow: false } };

export default function AdminCreateFormPage() {
  return <FormBuilder mode="create" />;
}
