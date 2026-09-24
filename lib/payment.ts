import { GRADES, LESSON_PRICE_EGP, WHATSAPP, type Grade } from "@/lib/config";

export type GradeLevel = "first" | "second";

export function getGradeLevel(grade: string): GradeLevel | null {
  if (grade === GRADES[0] || grade === GRADES[1]) return "first";
  if (grade === GRADES[2] || grade === GRADES[3]) return "second";
  return null;
}

export interface PaymentInstructions {
  price: number;
  methods: string[];
  number: string;
}

/** Payment instructions depend on the selected grade — only relevant methods are returned. */
export function getPaymentInstructions(grade: string): PaymentInstructions | null {
  const level = getGradeLevel(grade);
  if (level === "first") {
    return { price: LESSON_PRICE_EGP, methods: ["InstaPay"], number: "01222803316" };
  }
  if (level === "second") {
    return { price: LESSON_PRICE_EGP, methods: ["InstaPay", "Orange Cash"], number: "01220085313" };
  }
  return null;
}

/**
 * Builds a pre-filled WhatsApp link. This is NOT an automatic server-side message:
 * the student must tap "send" inside WhatsApp themselves.
 */
export function buildWhatsAppLink(input: { studentName: string; senderNumber: string; grade: Grade | string }): string {
  const text = [
    "تم دفع",
    `بالأسم / ${input.studentName}`,
    `الرقم الذي تم تحويل منه / ${input.senderNumber}`,
    `الصف / ${input.grade}`,
  ].join("\n");
  return `https://wa.me/${WHATSAPP.international}?text=${encodeURIComponent(text)}`;
}

export function formatEgp(value: number): string {
  return `${new Intl.NumberFormat("en-US").format(value)} ج.م`;
}

const DATE_LOCALE = "ar-EG-u-nu-latn";
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(DATE_LOCALE, { dateStyle: "medium", timeZone: "Africa/Cairo" }).format(new Date(iso));
}
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat(DATE_LOCALE, { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" }).format(new Date(iso));
}
/** YYYY-MM-DD in Cairo time, used for day grouping and date filters. */
export function cairoDay(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo" }).format(new Date(iso));
}
