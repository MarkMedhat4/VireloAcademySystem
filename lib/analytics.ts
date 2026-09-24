import { GRADES, GRADE_SHORT, type Grade } from "@/lib/config";
import { cairoDay } from "@/lib/payment";
import type { Payment, Student } from "@/lib/types";

/* ───────── Status model ─────────
 * unpaid   → the student declared "لم يتم الدفع"
 * pending  → declared paid + proof uploaded, waiting for an admin to review
 * paid     → admin confirmed the payment
 * rejected → admin rejected the proof
 */
export type PaymentState = "unpaid" | "pending" | "paid" | "rejected";

export function paymentState(p: Pick<Payment, "paid" | "status">): PaymentState {
  if (!p.paid) return "unpaid";
  return p.status;
}

export const STATE_LABEL: Record<PaymentState, string> = {
  unpaid: "لم يتم الدفع",
  pending: "قيد المراجعة",
  paid: "مؤكد",
  rejected: "مرفوض",
};

/** Words searchable in the admin search box (Arabic + the English words used by the team). */
const STATE_KEYWORDS: Record<PaymentState, string> = {
  unpaid: "لم يتم الدفع unpaid not paid",
  pending: "قيد المراجعة pending",
  paid: "مؤكد paid",
  rejected: "مرفوض rejected",
};

export interface Filters {
  q: string;
  grade: string; // "" = all
  status: string; // "" = all, otherwise PaymentState
  from: string; // YYYY-MM-DD or ""
  to: string;
}

export const NO_FILTERS: Filters = { q: "", grade: "", status: "", from: "", to: "" };

/** Lower-case, strip Arabic diacritics, unify alef/yaa/taa-marbuta and Arabic-Indic digits. */
export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

function matchesQuery(fields: Array<string | null | undefined>, q: string): boolean {
  const needle = normalizeText(q.trim());
  if (!needle) return true;
  const hay = normalizeText(fields.filter(Boolean).join(" | "));
  return needle.split(/\s+/).every((word) => hay.includes(word));
}

function inRange(iso: string, f: Filters): boolean {
  const day = cairoDay(iso);
  if (f.from && day < f.from) return false;
  if (f.to && day > f.to) return false;
  return true;
}

export function filterStudents(students: Student[], f: Filters): Student[] {
  return students.filter(
    (s) =>
      (!f.grade || s.grade === f.grade) &&
      inRange(s.created_at, f) &&
      matchesQuery([s.student_name, s.student_phone, s.guardian_name, s.guardian_phone, s.grade], f.q),
  );
}

export function filterPayments(payments: Payment[], f: Filters): Payment[] {
  return payments.filter((p) => {
    const state = paymentState(p);
    return (
      (!f.grade || p.grade === f.grade) &&
      (!f.status || state === f.status) &&
      inRange(p.created_at, f) &&
      matchesQuery([p.student_name, p.student_phone, p.sender_number, p.grade, STATE_KEYWORDS[state]], f.q)
    );
  });
}

/* ───────── KPIs ───────── */

const isCounted = (p: Payment) => p.paid && p.status !== "rejected";
const isFirst = (g: string) => g === GRADES[0] || g === GRADES[1];
const isSecond = (g: string) => g === GRADES[2] || g === GRADES[3];

export function computeKpis(students: Student[], payments: Payment[]) {
  const counted = payments.filter(isCounted);
  return {
    totalStudents: students.length,
    paymentOps: counted.length,
    revenue: counted.reduce((sum, p) => sum + p.amount, 0),
    pendingReview: payments.filter((p) => p.paid && p.status === "pending").length,
    firstSecondary: students.filter((s) => isFirst(s.grade)).length,
    secondSecondary: students.filter((s) => isSecond(s.grade)).length,
  };
}

/* ───────── Chart series ───────── */

export function studentsByGrade(students: Student[]) {
  return GRADES.map((g) => ({ grade: GRADE_SHORT[g as Grade], count: students.filter((s) => s.grade === g).length }));
}

export function paymentsByGrade(payments: Payment[]) {
  const counted = payments.filter(isCounted);
  return GRADES.map((g) => {
    const rows = counted.filter((p) => p.grade === g);
    return { grade: GRADE_SHORT[g as Grade], count: rows.length, amount: rows.reduce((s, p) => s + p.amount, 0) };
  });
}

function addDays(day: string, delta: number): string {
  const d = new Date(day + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/** Payments per day for the last `days` days (Cairo time), zero-filled. */
export function dailyPayments(payments: Payment[], days = 30, today = cairoDay(new Date().toISOString())) {
  const counted = payments.filter(isCounted);
  const byDay = new Map<string, { count: number; amount: number }>();
  for (const p of counted) {
    const d = cairoDay(p.created_at);
    const cur = byDay.get(d) ?? { count: 0, amount: 0 };
    cur.count += 1;
    cur.amount += p.amount;
    byDay.set(d, cur);
  }
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(today, i - (days - 1));
    const v = byDay.get(date) ?? { count: 0, amount: 0 };
    return { date, label: date.slice(5).replace("-", "/"), count: v.count, amount: v.amount };
  });
}

/** Revenue per month for the last `months` months, zero-filled. */
export function monthlyRevenue(payments: Payment[], months = 6, today = cairoDay(new Date().toISOString())) {
  const counted = payments.filter(isCounted);
  const [ty, tm] = today.split("-").map(Number);
  const keys = Array.from({ length: months }, (_, i) => {
    const idx = ty * 12 + (tm - 1) - (months - 1 - i);
    const y = Math.floor(idx / 12);
    const m = (idx % 12) + 1;
    return `${y}-${String(m).padStart(2, "0")}`;
  });
  const fmt = new Intl.DateTimeFormat("ar-EG-u-nu-latn", { month: "short", year: "2-digit", timeZone: "UTC" });
  return keys.map((key) => {
    const amount = counted.filter((p) => cairoDay(p.created_at).startsWith(key)).reduce((s, p) => s + p.amount, 0);
    return { month: fmt.format(new Date(`${key}-01T12:00:00Z`)), key, amount };
  });
}
