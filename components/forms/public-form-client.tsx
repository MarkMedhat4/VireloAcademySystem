"use client";

import { submitFormResponse } from "@/app/actions/forms";
import { DynamicFormRenderer } from "@/components/forms/dynamic-form-renderer";
import type { FormField } from "@/lib/forms";

export function PublicFormClient({ slug, fields }: { slug: string; fields: FormField[] }) {
  return (
    <DynamicFormRenderer
      fields={fields}
      onSubmit={async (data) => {
        const res = await submitFormResponse(slug, data);
        if (res.ok) return { ok: true, message: res.data.successMessage };
        return { ok: false, message: res.message, fieldErrors: res.fieldErrors };
      }}
    />
  );
}
