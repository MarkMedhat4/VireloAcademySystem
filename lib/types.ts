export type PaymentStatus = "pending" | "paid" | "rejected";

export interface Student {
  id: string;
  student_name: string;
  student_phone: string;
  guardian_name: string;
  guardian_phone: string;
  grade: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  student_name: string;
  student_phone: string;
  sender_number: string | null;
  grade: string;
  amount: number;
  paid: boolean;
  status: PaymentStatus;
  proof_path: string | null;
  created_at: string;
}

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };
