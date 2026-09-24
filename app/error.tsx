"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-2xl">حدث خطأ غير متوقع</h1>
      <p className="mt-3 text-ink-2">نعتذر عن ذلك. حاول مرة أخرى، وإذا استمرت المشكلة تواصل مع إدارة الأكاديمية.</p>
      <Button className="mt-8" onClick={reset}>
        إعادة المحاولة
      </Button>
    </section>
  );
}
