import type { Metadata, Viewport } from "next";
import "@fontsource-variable/cairo/index.css";
import "@fontsource-variable/montserrat/index.css";
import "./globals.css";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { SITE } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Virelo Academy — منظومة تسجيل ودفع ومتابعة الطلاب",
    template: "%s | Virelo Academy",
  },
  description: "منصة بسيطة للطلاب وأولياء الأمور، مع لوحة تحكم إدارية موحدة لإدارة التسجيلات والمدفوعات وبيانات الطلاب.",
  openGraph: {
    title: "Virelo Academy",
    description: SITE.tagline_ar,
    type: "website",
    locale: "ar_EG",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#071A33",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-gold focus:px-4 focus:py-3 focus:font-semibold focus:text-navy"
        >
          تخطّي إلى المحتوى
        </a>
        <Navbar />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
