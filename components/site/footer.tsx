import Link from "next/link";
import { Link2 } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "@/components/site/brand-icons";
import { NAV_LINKS, SITE, SOCIAL, WHATSAPP } from "@/lib/config";

const socials = [
  { href: SOCIAL.instagram, label: "Instagram — Virelo Academy", Icon: InstagramIcon },
  { href: SOCIAL.facebook, label: "Facebook — Virelo Academy", Icon: FacebookIcon },
  { href: SOCIAL.whatsapp, label: "WhatsApp — Virelo Academy", Icon: WhatsAppIcon },
];

export function Footer() {
  return (
    <footer className="mt-auto bg-navy text-white">
      <div className="h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent" aria-hidden />
      <div className="mx-auto grid w-full max-w-[1280px] gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8 lg:py-16">
        <div>
          <Logo size={80} />
          <p className="mt-6 text-xl font-bold text-gold">{SITE.tagline_ar}</p>
          <p className="mt-1 text-sm font-semibold text-white/80">
            <bdi lang="en" dir="ltr">{SITE.tagline_en}</bdi>
          </p>
          <p className="mt-4 max-w-sm text-sm text-white/70">منصة بسيطة للطلاب وأولياء الأمور لإدارة التسجيلات والمدفوعات وبيانات الطلاب.</p>
        </div>

        <nav aria-label="روابط سريعة">
          <h2 className="text-base font-bold">روابط سريعة</h2>
          <div className="gold-rule mt-2" />
          <ul className="mt-4 space-y-1">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="inline-flex min-h-11 items-center text-white/80 transition-colors hover:text-gold">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="flex items-center gap-2 text-base font-bold">
            <Link2 className="size-5 text-gold" aria-hidden />
            <bdi lang="en" dir="ltr">Connect with us:</bdi>
          </h2>
          <div className="gold-rule mt-2" />
          <ul className="mt-4 flex gap-3">
            {socials.map(({ href, label, Icon }) => (
              <li key={href}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex size-11 items-center justify-center rounded-md border border-white/20 text-white transition duration-200 hover:-translate-y-px hover:border-gold hover:text-gold"
                >
                  <Icon className="size-5" />
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-white/70">
            واتساب:{" "}
            <a href={SOCIAL.whatsapp} target="_blank" rel="noopener noreferrer" dir="ltr" className="inline-block font-semibold text-white hover:text-gold">
              {WHATSAPP.local}
            </a>
          </p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-[1280px] px-4 py-4 text-center text-xs text-white/60 sm:px-6 lg:px-8" lang="en" dir="ltr">
          © {new Date().getFullYear()} Virelo Academy. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
