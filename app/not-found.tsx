import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/site/logo";

export default function NotFound() {
  return (
    <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-grid-dark px-4 py-16 text-center text-white">
      <div aria-hidden className="pointer-events-none absolute -end-16 -top-16 size-72 rotate-12 border border-gold/20" />
      <div className="relative animate-rise">
        <Logo size={96} className="mx-auto" />
        <p className="mt-6 text-6xl font-bold text-gold" lang="en" dir="ltr">
          404
        </p>
        <h1 className="mt-2 text-2xl md:text-3xl">الصفحة غير موجودة</h1>
        <p className="mx-auto mt-3 max-w-md text-white/75">يبدو أنك وصلت إلى مكان غير موجود.</p>
        <ButtonLink href="/" className="mt-8">
          العودة للرئيسية
        </ButtonLink>
      </div>
    </section>
  );
}
