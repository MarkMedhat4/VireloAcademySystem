"use client";

import { Check, Copy, Smartphone, Wallet } from "lucide-react";
import { useState } from "react";
import { getPaymentInstructions } from "@/lib/payment";

/** Grade-dependent payment instructions. Shows ONLY the methods relevant to the selected grade. */
export function PaymentInstructions({ grade }: { grade: string }) {
  const info = getPaymentInstructions(grade);
  const [copied, setCopied] = useState(false);

  return (
    <div aria-live="polite">
      {info && (
        <div className="animate-rise rounded-lg border border-gold/50 bg-gold-soft/40 p-5 md:p-6">
          <h2 className="flex items-center gap-2 text-lg">
            <Wallet className="size-5 text-gold" aria-hidden />
            السعر وطرق الدفع
          </h2>
          <p className="mt-3 font-semibold">سعر الحصة {info.price} جنيه.</p>
          <p className="mt-3 text-ink-2">الدفع متاح عن طريق:</p>
          <ul className="mt-1 space-y-1">
            {info.methods.map((m) => (
              <li key={m} className="flex items-center gap-2 font-semibold">
                <span className="size-1.5 rounded-full bg-gold" aria-hidden />
                <span lang="en" dir="ltr">
                  {m}
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-4 flex items-center gap-2 text-ink-2">
            <Smartphone className="size-5 text-gold" aria-hidden />
            رقم الدفع:
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="rounded-md border border-line bg-white px-4 py-2 text-xl font-bold num" dir="ltr">
              {info.number}
            </span>
            <button
              type="button"
              className="on-light inline-flex min-h-11 items-center gap-2 rounded-md border border-navy bg-white px-4 text-sm font-semibold transition hover:border-gold"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(info.number);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                } catch {
                  /* clipboard unavailable — the number is visible and selectable */
                }
              }}
            >
              {copied ? <Check className="size-4 text-success" aria-hidden /> : <Copy className="size-4" aria-hidden />}
              {copied ? "تم النسخ" : "نسخ الرقم"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
