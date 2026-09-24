import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizePhone, registerSchema, paymentSchema, paymentFieldsSchema, studentNameSchema } from "../lib/validation";
import { getPaymentInstructions, buildWhatsAppLink } from "../lib/payment";
import { GRADES } from "../lib/config";
import { toCsv } from "../lib/csv";
import { computeKpis, filterPayments, filterStudents, NO_FILTERS, monthlyRevenue, dailyPayments } from "../lib/analytics";
import type { Payment, Student } from "../lib/types";

const goodStudent = {
  student_name: "أحمد محمد علي حسن",
  student_phone: "01012345678",
  guardian_name: "محمد علي",
  guardian_phone: "01112345678",
  grade: GRADES[0],
};

test("phone normalization", () => {
  assert.equal(normalizePhone("+20 101 234 5678"), "01012345678");
  assert.equal(normalizePhone("١٠١٢٣٤٥٦٧٨"), "01012345678");
  assert.equal(normalizePhone("201012345678"), "01012345678");
  assert.equal(normalizePhone("0020-101-234-5678"), "01012345678");
});

test("registration accepts valid data and normalizes phones", () => {
  const r = registerSchema.safeParse({ ...goodStudent, student_phone: "+201012345678" });
  assert.equal(r.success, true);
  if (r.success) assert.equal(r.data.student_phone, "01012345678");
});

test("registration rejects invalid phone, short name, bad grade, missing fields", () => {
  assert.equal(registerSchema.safeParse({ ...goodStudent, student_phone: "123" }).success, false);
  assert.equal(registerSchema.safeParse({ ...goodStudent, student_phone: "01312345678" }).success, false);
  assert.equal(registerSchema.safeParse({ ...goodStudent, student_name: "أحمد" }).success, false);
  assert.equal(registerSchema.safeParse({ ...goodStudent, grade: "الصف الثالث" }).success, false);
  assert.equal(registerSchema.safeParse({ ...goodStudent, guardian_name: "" }).success, false);
  assert.equal(registerSchema.safeParse({}).success, false);
  assert.equal(studentNameSchema.safeParse("أحمد <script> محمد علي").success, false);
});

const proof = "2026/09/3f2b8c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e.jpg";

test("payment: paid requires sender + proof; unpaid does not", () => {
  const base = { student_name: goodStudent.student_name, student_phone: goodStudent.student_phone, grade: GRADES[2] };
  assert.equal(paymentSchema.safeParse({ ...base, paid: true, sender_number: "01012345678", proof_path: proof }).success, true);
  assert.equal(paymentSchema.safeParse({ ...base, paid: true, sender_number: "01012345678" }).success, false);
  assert.equal(paymentSchema.safeParse({ ...base, paid: true, proof_path: proof }).success, false);
  assert.equal(paymentSchema.safeParse({ ...base, paid: true, sender_number: "01012345678", proof_path: "../../etc/passwd" }).success, false);
  const unpaid = paymentSchema.safeParse({ ...base, paid: false, sender_number: "", proof_path: proof });
  assert.equal(unpaid.success, true);
  if (unpaid.success) assert.equal(unpaid.data.proof_path, null); // never keep a proof for unpaid
  assert.equal(paymentFieldsSchema.safeParse({ ...base, paid: true, sender_number: "01012345678" }).success, true);
});

test("payment schema ignores any client-supplied amount", () => {
  const r = paymentSchema.safeParse({ student_name: goodStudent.student_name, student_phone: goodStudent.student_phone, grade: GRADES[0], paid: false, amount: 1 });
  assert.equal(r.success, true);
  if (r.success) assert.equal("amount" in r.data, false);
});

test("dynamic payment instructions per grade", () => {
  for (const g of [GRADES[0], GRADES[1]]) {
    const i = getPaymentInstructions(g)!;
    assert.deepEqual(i.methods, ["InstaPay"]);
    assert.equal(i.number, "01222803316");
    assert.equal(i.price, 50);
  }
  for (const g of [GRADES[2], GRADES[3]]) {
    const i = getPaymentInstructions(g)!;
    assert.deepEqual(i.methods, ["InstaPay", "Orange Cash"]);
    assert.equal(i.number, "01220085313");
  }
  assert.equal(getPaymentInstructions(""), null);
});

test("whatsapp link uses international number and exact message", () => {
  const url = buildWhatsAppLink({ studentName: "أحمد محمد علي حسن", senderNumber: "01012345678", grade: GRADES[0] });
  assert.ok(url.startsWith("https://wa.me/201552481349?text="));
  const text = decodeURIComponent(url.split("?text=")[1]);
  assert.equal(text, `تم دفع\nبالأسم / أحمد محمد علي حسن\nالرقم الذي تم تحويل منه / 01012345678\nالصف / ${GRADES[0]}`);
});

test("csv escapes quotes, commas and formula injection", () => {
  const csv = toCsv(["a", "b"], [['x,"y"', "=SUM(A1)"]]);
  assert.ok(csv.includes('"x,""y"""'));
  assert.ok(csv.includes("'=SUM(A1)"));
  assert.ok(csv.startsWith("\uFEFF"));
});

const mkStudent = (over: Partial<Student>): Student => ({
  id: "s", student_name: "أحمد محمد علي حسن", student_phone: "01012345678", guardian_name: "محمد علي", guardian_phone: "01112345678",
  grade: GRADES[0], created_at: "2026-09-20T10:00:00Z", updated_at: "2026-09-20T10:00:00Z", ...over,
});
const mkPay = (over: Partial<Payment>): Payment => ({
  id: "p", student_name: "أحمد محمد علي حسن", student_phone: "01012345678", sender_number: "01012345678", grade: GRADES[0],
  amount: 50, paid: true, status: "pending", proof_path: "x", created_at: "2026-09-20T10:00:00Z", ...over,
});

test("kpis, search (Arabic normalization) and filters", () => {
  const students = [mkStudent({}), mkStudent({ id: "s2", student_name: "إيمان سمير عادل فؤاد", student_phone: "01212345678", grade: GRADES[3] })];
  const payments = [mkPay({}), mkPay({ id: "p2", status: "paid" }), mkPay({ id: "p3", status: "rejected" }), mkPay({ id: "p4", paid: false, proof_path: null })];
  const k = computeKpis(students, payments);
  assert.equal(k.totalStudents, 2);
  assert.equal(k.paymentOps, 2);
  assert.equal(k.revenue, 100);
  assert.equal(k.pendingReview, 1);
  assert.equal(k.firstSecondary, 1);
  assert.equal(k.secondSecondary, 1);
  assert.equal(filterStudents(students, { ...NO_FILTERS, q: "ايمان" }).length, 1); // إ → ا
  assert.equal(filterStudents(students, { ...NO_FILTERS, q: "0121" }).length, 1);
  assert.equal(filterStudents(students, { ...NO_FILTERS, grade: GRADES[3] }).length, 1);
  assert.equal(filterPayments(payments, { ...NO_FILTERS, status: "paid" }).length, 1);
  assert.equal(filterPayments(payments, { ...NO_FILTERS, q: "pending" }).length, 1);
  assert.equal(filterPayments(payments, { ...NO_FILTERS, from: "2026-09-21" }).length, 0);
});

test("time series are zero-filled", () => {
  const p = [mkPay({ created_at: "2026-09-20T10:00:00Z" })];
  const d = dailyPayments(p, 30, "2026-09-24");
  assert.equal(d.length, 30);
  assert.equal(d.at(-1)!.date, "2026-09-24");
  assert.equal(d.reduce((s, x) => s + x.count, 0), 1);
  const m = monthlyRevenue(p, 6, "2026-09-24");
  assert.equal(m.length, 6);
  assert.equal(m.at(-1)!.amount, 50);
});

import { signToken, verifyToken } from "../lib/session-token";

test("student session token: valid, tampered, expired, wrong secret", () => {
  const secret = "test-secret";
  const now = Date.now();
  const t = signToken({ sid: "student-1", exp: now + 60_000 }, secret);
  assert.equal(verifyToken(t, secret, now), "student-1");
  assert.equal(verifyToken(t, "other-secret", now), null);
  assert.equal(verifyToken(t, secret, now + 120_000), null); // expired
  const [body, sig] = t.split(".");
  const forged = Buffer.from(JSON.stringify({ sid: "student-2", exp: now + 60_000 })).toString("base64url");
  assert.equal(verifyToken(`${forged}.${sig}`, secret, now), null); // payload swapped, signature reused
  assert.equal(verifyToken(`${body}.x`, secret, now), null);
  assert.equal(verifyToken(undefined, secret, now), null);
  assert.equal(verifyToken("garbage", secret, now), null);
});
