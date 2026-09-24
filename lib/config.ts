/**
 * Central business configuration for Virelo Academy.
 * Everything here is public information shown to students — no secrets.
 */

export const SITE = {
  name: "Virelo Academy",
  tagline_ar: "لا ننافس على الجودة. نقودها.",
  tagline_en: "WE DON'T COMPETE ON QUALITY. WE LEAD IT!",
  statement: "Modern Education × Technology × Premium Academic Experience",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

/** Exact grade labels as specified. They are stored verbatim in the database. */
export const GRADES = [
  "الصف الأول الثانوي عربي",
  "الصف الأول الثانوي لغات",
  "الصف الثاني الثانوي عربي",
  "الصف الثاني الثانوي لغات",
] as const;

export type Grade = (typeof GRADES)[number];

/** Short labels used in admin filters and charts. */
export const GRADE_SHORT: Record<Grade, string> = {
  "الصف الأول الثانوي عربي": "الأول الثانوي عربي",
  "الصف الأول الثانوي لغات": "الأول الثانوي لغات",
  "الصف الثاني الثانوي عربي": "الثاني الثانوي عربي",
  "الصف الثاني الثانوي لغات": "الثاني الثانوي لغات",
};

/** Lesson price. The server always applies this value — the client can never send a price. */
export const LESSON_PRICE_EGP = 50;

export const PROOF_BUCKET = "payment-proofs";
export const MAX_PROOF_BYTES = 5 * 1024 * 1024; // 5MB
export const PROOF_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;
export type ProofMime = keyof typeof PROOF_TYPES;

export const WHATSAPP = {
  local: "01552481349",
  international: "201552481349",
} as const;

export const SOCIAL = {
  instagram: "https://www.instagram.com/vireloacademy",
  facebook: "https://www.facebook.com/share/1FMkL8Cs1s/",
  whatsapp: `https://wa.me/${WHATSAPP.international}`,
} as const;

export const NAV_LINKS = [
  { href: "/register", label: "تسجيل طالب" },
  { href: "/payment", label: "الدفع" },
  { href: "/student", label: "دخول الطالب" },
  { href: "/admin", label: "Admin" },
] as const;
