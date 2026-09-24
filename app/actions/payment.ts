"use server";

import { randomUUID } from "node:crypto";
import { LESSON_PRICE_EGP, MAX_PROOF_BYTES, PROOF_BUCKET, PROOF_TYPES, type ProofMime } from "@/lib/config";
import { fieldErrorsOf, paymentSchema } from "@/lib/validation";
import { createServiceSupabase } from "@/lib/supabase-server";
import { isServiceRoleConfigured, NOT_CONFIGURED_MESSAGE } from "@/lib/env";
import { rateLimit, TOO_MANY_MESSAGE } from "@/lib/rate-limit";
import type { ActionResult } from "@/lib/types";

/** Step 1 (only when the student says they paid): issue a one-time signed upload URL for the private bucket. */
export async function preparePaymentProof(input: { contentType: string; size: number }): Promise<ActionResult<{ path: string; token: string }>> {
  if (!(await rateLimit("proof-upload", 10, 10 * 60_000))) return { ok: false, message: TOO_MANY_MESSAGE };
  if (!isServiceRoleConfigured()) return { ok: false, message: NOT_CONFIGURED_MESSAGE };

  const ext = PROOF_TYPES[input.contentType as ProofMime];
  if (!ext) return { ok: false, message: "الملف يجب أن يكون صورة بصيغة JPG أو PNG أو WEBP." };
  if (!Number.isFinite(input.size) || input.size <= 0 || input.size > MAX_PROOF_BYTES) {
    return { ok: false, message: "حجم الصورة يجب ألا يتجاوز 5 ميجابايت." };
  }

  const now = new Date();
  const path = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.${ext}`;
  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase.storage.from(PROOF_BUCKET).createSignedUploadUrl(path);
    if (error || !data) {
      console.error("[preparePaymentProof]", error?.message);
      return { ok: false, message: "تعذر تجهيز رفع الصورة. حاول مرة أخرى." };
    }
    return { ok: true, data: { path: data.path, token: data.token } };
  } catch (e) {
    console.error("[preparePaymentProof] unexpected", e);
    return { ok: false, message: "حدث خطأ في الاتصال. تحقق من الإنترنت وحاول مرة أخرى." };
  }
}

function hasImageSignature(bytes: Uint8Array, ext: string): boolean {
  if (ext === "jpg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (ext === "png") return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (ext === "webp") {
    const riff = String.fromCharCode(...bytes.slice(0, 4));
    const webp = String.fromCharCode(...bytes.slice(8, 12));
    return riff === "RIFF" && webp === "WEBP";
  }
  return false;
}

/** Step 2: validate everything on the server and store the payment. The price is ALWAYS the server constant. */
export async function submitPayment(
  input: unknown,
): Promise<ActionResult<{ paid: boolean; student_name: string; sender_number: string | null; grade: string }>> {
  if (typeof input === "object" && input !== null && "website" in input && (input as { website?: unknown }).website) {
    return { ok: true, data: { paid: false, student_name: "", sender_number: null, grade: "" } };
  }
  if (!(await rateLimit("payment", 8, 10 * 60_000))) return { ok: false, message: TOO_MANY_MESSAGE };
  if (!isServiceRoleConfigured()) return { ok: false, message: NOT_CONFIGURED_MESSAGE };

  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "تحقق من البيانات المُدخلة وحاول مرة أخرى.", fieldErrors: fieldErrorsOf(parsed.error) };
  }
  const data = parsed.data;

  try {
    const supabase = createServiceSupabase();

    if (data.paid && data.proof_path) {
      // Verify the uploaded object really exists, is small enough and is a real image (magic bytes).
      const { data: blob, error: dlError } = await supabase.storage.from(PROOF_BUCKET).download(data.proof_path);
      if (dlError || !blob) {
        return { ok: false, message: "لم يتم العثور على صورة الدفع. أعد رفع الصورة وحاول مرة أخرى.", fieldErrors: { proof: "أعد رفع صورة الدفع" } };
      }
      const ext = data.proof_path.split(".").pop() ?? "";
      const bytes = new Uint8Array(await blob.arrayBuffer());
      if (bytes.length === 0 || bytes.length > MAX_PROOF_BYTES || !hasImageSignature(bytes, ext)) {
        await supabase.storage.from(PROOF_BUCKET).remove([data.proof_path]);
        return { ok: false, message: "الملف المرفوع ليس صورة صالحة.", fieldErrors: { proof: "الملف المرفوع ليس صورة صالحة" } };
      }
    }

    const { error } = await supabase.from("payments").insert({
      student_name: data.student_name,
      student_phone: data.student_phone,
      sender_number: data.sender_number,
      grade: data.grade,
      amount: LESSON_PRICE_EGP,
      paid: data.paid,
      status: "pending",
      proof_path: data.proof_path,
    });
    if (error) {
      console.error("[submitPayment] insert failed", error.code, error.message);
      if (data.proof_path) await supabase.storage.from(PROOF_BUCKET).remove([data.proof_path]);
      if (error.code === "23505") return { ok: false, message: "تم إرسال هذا الدفع من قبل." };
      return { ok: false, message: "تعذر حفظ عملية الدفع حالياً. يرجى المحاولة مرة أخرى بعد قليل." };
    }
    return { ok: true, data: { paid: data.paid, student_name: data.student_name, sender_number: data.sender_number, grade: data.grade } };
  } catch (e) {
    console.error("[submitPayment] unexpected", e);
    return { ok: false, message: "حدث خطأ في الاتصال. تحقق من الإنترنت وحاول مرة أخرى." };
  }
}
