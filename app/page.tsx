import Link from "next/link";
import { ArrowLeft, CreditCard, GraduationCap, UserRound } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/site/logo";
import { SITE } from "@/lib/config";

const services = [
  {
    href: "/register",
    icon: GraduationCap,
    en: "Student Registration",
    title: "تسجيل الطالب",
    text: "تسجيل بيانات الطالب وولي الأمر والصف الدراسي.",
  },
  {
    href: "/payment",
    icon: CreditCard,
    en: "Payment",
    title: "الدفع",
    text: "تأكيد الدفع ورفع صورة التحويل حسب الصف.",
  },
  {
    href: "/student",
    icon: UserRound,
    en: "Student Portal",
    title: "بوابة الطالب",
    text: "الطالب يدخل برقم هاتفه لعرض وتعديل بياناته.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-grid-dark text-white">
        {/* Decorative geometry — subtle by design */}
        <div aria-hidden className="pointer-events-none absolute -bottom-24 start-[-64px] size-64 rotate-12 border border-gold/20" />
        <div aria-hidden className="pointer-events-none absolute end-[8%] top-16 size-4 bg-gold/40" />
        <div aria-hidden className="pointer-events-none absolute end-[22%] bottom-24 size-2 bg-gold/60" />

        <div className="relative mx-auto grid w-full max-w-[1280px] items-center gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:px-8 lg:py-28">
          <div className="animate-rise">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-gold">
              <bdi lang="en" dir="ltr">VIRELO ACADEMY</bdi>
            </p>
            <h1 className="text-[2.25rem] leading-[1.35] sm:text-5xl lg:text-[3.5rem]">منظومة تسجيل ودفع ومتابعة الطلاب</h1>
            <p className="mt-6 max-w-xl text-base text-white/80 md:text-lg">
              منصة بسيطة للطلاب وأولياء الأمور، مع لوحة تحكم إدارية موحدة لإدارة التسجيلات والمدفوعات وبيانات الطلاب.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <ButtonLink href="/register" size="lg">
                تسجيل طالب
              </ButtonLink>
              <ButtonLink href="/payment" size="lg" variant="secondary-dark">
                دفع حصة
              </ButtonLink>
            </div>
            <p className="mt-10 text-xs text-white/50">
              <bdi lang="en" dir="ltr">{SITE.statement}</bdi>
            </p>
          </div>

          <div className="animate-rise delay-2 relative mx-auto w-fit">
            <div aria-hidden className="absolute -inset-4 rotate-3 rounded-2xl border border-gold/30" />
            <div className="animate-drift relative">
              <Logo size={288} priority className="rounded-2xl shadow-2xl ring-1 ring-gold/30 max-lg:size-52!" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-grid-light">
        <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 md:py-24 lg:px-8">
          <div className="mb-12 max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-ink-2">
              <bdi lang="en" dir="ltr">Services</bdi>
            </p>
            <h2 className="mt-2 text-[1.75rem] md:text-4xl">كل ما يحتاجه الطالب في مكان واحد</h2>
            <div className="gold-rule mt-4" />
          </div>

          <ul className="grid gap-4 md:grid-cols-3 md:gap-6">
            {services.map(({ href, icon: Icon, en, title, text }, i) => (
              <li key={href} className={`animate-rise ${i === 1 ? "delay-1" : i === 2 ? "delay-2" : ""}`}>
                <Link href={href} className="on-light group block h-full rounded-lg">
                  <Card accent interactive className="h-full p-6 md:p-8">
                    <div className="flex size-12 items-center justify-center rounded-md border border-gold/40 bg-gold-soft/60">
                      <Icon className="size-6 text-gold" strokeWidth={1.75} aria-hidden />
                    </div>
                    <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-ink-2">
                      <bdi lang="en" dir="ltr">{en}</bdi>
                    </p>
                    <h3 className="mt-1 text-2xl">{title}</h3>
                    <p className="mt-2 text-ink-2">{text}</p>
                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-navy">
                      ابدأ الآن
                      <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-1" aria-hidden />
                    </span>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
