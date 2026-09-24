# Virelo Academy System

> **لا ننافس على الجودة. نقودها.** — *WE DON'T COMPETE ON QUALITY. WE LEAD IT.*

A real, working web system for **Virelo Academy**: student registration, payment registration with proof-of-payment upload, an OTP-protected student portal, and an admin dashboard — built with **Next.js + TypeScript + Tailwind CSS** on **Supabase** (PostgreSQL, Auth, Storage, Row Level Security).

Arabic / RTL-first (`<html lang="ar" dir="rtl">`), Cairo + Montserrat, Navy `#071A33` + Gold `#D4AF37` + White, following the Virelo Master Style System.

---

## Table of contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Project structure](#project-structure)
4. [Installation](#installation)
5. [Supabase setup (A → Z)](#supabase-setup-a--z)
6. [Environment variables](#environment-variables)
7. [Database](#database)
8. [Storage](#storage)
9. [Student flow](#student-flow)
10. [Admin flow](#admin-flow)
11. [Deployment (GitHub + Vercel)](#deployment-github--vercel)
12. [Security](#security)
13. [Design system & customization](#design-system--customization)
14. [Assumptions & decisions](#assumptions--decisions)
15. [Replace before launch](#replace-before-launch)
16. [Testing & what was verified](#testing--what-was-verified)
17. [Troubleshooting](#troubleshooting)

---

## Features

**Public**
- **Home** — premium landing page with the three entry cards (registration, payment, student portal).
- **`/register`** — student registration (name, phone, guardian name/phone, grade). Server-side validation, duplicate-phone protection, Arabic error messages.
- **`/payment`** — lesson payment (50 EGP). **Payment instructions change instantly with the selected grade** (1st secondary → InstaPay only; 2nd secondary → InstaPay + Orange Cash). "Paid" requires a proof image (JPG/PNG/WEBP, ≤ 5 MB) uploaded to a **private** bucket. After a paid submission the student gets a **pre-filled WhatsApp message** to `01552481349`.
- **`/student`** — student portal: phone → **SMS OTP** → view and edit own data (name, guardian name/phone, grade). The student's phone number is read-only.

**Admin (`/admin`)**
- Login with username (or email) + password through Supabase Auth; only accounts listed in `public.admins` get in.
- KPI cards, four Recharts charts (students by grade, payments by grade, daily payments, monthly revenue), students table, payments table.
- Global search (Arabic-normalised), grade / status / date filters, sorting, pagination, CSV export.
- View a payment proof through a **2-minute signed URL**; confirm / reject payments.

**Quality**: skeleton loading, empty states, Arabic errors, accessible forms (labels, focus, `aria-*`), 44 px touch targets, `prefers-reduced-motion`, responsive from 320 px, security headers.

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript (strict) |
| Styling | Tailwind CSS v4 + centralised tokens (`app/globals.css`, `design-system/tokens.ts`) |
| Icons | Lucide (UI) + Simple Icons (brand glyphs) |
| Fonts | Cairo (Arabic) + Montserrat (Latin/numbers) via Fontsource (self-hosted, no Google request) |
| Backend | Supabase: PostgreSQL, Auth (password + phone OTP), Storage, RLS |
| Validation | Zod (shared by browser and server) |
| Charts | Recharts |
| Hosting | GitHub → Vercel, Supabase cloud |

## Project structure

```text
virelo-academy-system/
├── app/
│   ├── layout.tsx            # <html lang="ar" dir="rtl">, navbar, footer
│   ├── page.tsx              # Home
│   ├── register/  payment/  student/  admin/
│   ├── actions/              # Server actions: register, payment, student (OTP)
│   ├── admin/actions.ts      # Server actions: login/logout, signed proof URL, payment status
│   ├── globals.css           # Design tokens + motion
│   └── not-found.tsx, error.tsx, */loading.tsx
├── components/
│   ├── ui/                   # Button, Card, Badge, Alert, Field, Skeleton, EmptyState
│   ├── forms/                # RegisterForm, PaymentForm, PaymentInstructions, ProofUpload, StudentPortal
│   ├── dashboard/            # AdminShell, AdminLogin, KpiCard, charts, ProofDialog
│   ├── tables/               # DataTable, StudentsTable, PaymentsTable
│   └── site/                 # Navbar, Footer, Logo, PageShell, brand icons
├── design-system/tokens.ts   # Colors, spacing, radii, motion
├── lib/                      # config, validation, payment, analytics, csv, auth, supabase clients, env
├── supabase/                 # schema.sql, policies.sql, seed.sql (admin template)
├── public/logo/virelo-logo.jpeg   # Official logo (unaltered)
├── proxy.ts                  # Supabase session refresh (Next.js 16 "proxy", formerly middleware)
├── tests/                    # Unit tests (validation, payment rules, analytics, CSV)
├── .env.example  .gitignore  README.md
```

## Installation

Requirements: Node.js 20.9+ (tested on 22) and npm.

```bash
npm install
cp .env.example .env.local      # then fill in the values (see below)
npm run dev                     # http://localhost:3000
```

Other scripts: `npm run build`, `npm run start`, `npm run lint`, `npm run typecheck`, `npm test`.

> Without Supabase variables the site still builds and renders; forms show a friendly "service unavailable" message until you connect a project.

## Supabase setup (A → Z)

**1. Create a project** at <https://supabase.com> → New project. Note the *Project URL* and keys (Project Settings → API).

**2. Run the SQL** in *SQL Editor*, in this order:
1. `supabase/schema.sql` — tables, constraints, helper functions, trigger, **private** `payment-proofs` bucket.
2. `supabase/policies.sql` — Row Level Security policies (incl. storage policies).

Both files are idempotent (safe to re-run).

**3. Storage bucket.** `schema.sql` already creates `payment-proofs` as **private** with a 5 MB limit and image-only MIME types. Verify in *Storage* that the bucket shows as **Private**.

**4. Authentication.** *Authentication → Sign In / Providers*:
- **Email** — enabled (admins sign in with email + password). Consider requiring email confirmation.
- **Phone** — enable it and configure an **SMS provider** (Twilio, Twilio Verify, MessageBird, Vonage…). This is required for the student OTP.
  - For development without paying for SMS, use *Phone → "Test Phone Numbers and OTPs"* to define fixed test numbers/codes.
- *URL Configuration* → set **Site URL** to your production URL (and add `http://localhost:3000` as an extra redirect URL for dev).

**5. Create the two admin accounts** (there are exactly two administrators):
1. *Authentication → Users → Add user → Create new user* — enter email + a strong password, tick **Auto Confirm User**. Repeat for the second admin.
2. Copy each user's **UUID**.
3. Open `supabase/seed.sql`, replace the placeholders (UUID, lower-case **username** the admin will type at `/admin`, full name) and run the `insert` in the SQL Editor.

> Passwords live **only** in Supabase Auth / your password manager. They are never written to this repository, the SQL files, the README or any client code.

**6. RLS.** Already applied by `policies.sql` (see [Security](#security)). Confirm in *Authentication → Policies* that RLS is enabled on `students`, `payments` and `admins`.

**7. Environment variables.** Put the URL / anon key / service-role key in `.env.local` (dev) and in Vercel (production) — see below.

## Environment variables

| Variable | Exposed to browser? | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Anon/publishable key. Safe only because RLS denies anonymous table access. Used to upload proofs to server-issued signed URLs. |
| `SUPABASE_SERVICE_ROLE_KEY` | **NO — server only** | Bypasses RLS. Used inside server actions after validation (registration, payment, OTP eligibility check, admin username lookup). **Never** prefix with `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_SITE_URL` | yes | Canonical site URL (metadata) |

## Database

| Table | Purpose | Key columns |
| --- | --- | --- |
| `students` | Registered students | `id, student_name, student_phone (UNIQUE), guardian_name, guardian_phone, grade, created_at, updated_at` |
| `payments` | Payment declarations | `id, student_name, student_phone, sender_number, grade, amount (default 50), paid, status, proof_path, reviewed_at, created_at` |
| `admins` | Which Auth users are administrators | `user_id → auth.users, username, full_name` |

Integrity is enforced in the database too: Egyptian mobile format (`01[0125]xxxxxxxx`), the four allowed grades, name lengths, and "a *paid* payment must have a proof and a sender number". `students.updated_at` is maintained by a trigger, and a signed-in student can never change `student_phone`.

## Storage

Bucket **`payment-proofs`** — private, 5 MB, `image/jpeg | image/png | image/webp`. Object names are server-generated (`yyyy/mm/<uuid>.<ext>`). No public URLs exist: admins view proofs via `createSignedUrl` (120 s).

## Student flow

```text
/register  →  /payment  →  upload proof  →  WhatsApp message  →  /student (OTP)
```
1. **Register** — data validated in the browser (UX) and again on the server; stored with the service role because anonymous users have no table access.
2. **Pay** — choose the grade → matching instructions appear. If *paid*: the browser asks the server for a one-time **signed upload URL**, uploads the image **directly to Supabase Storage** (avoids Vercel's 4.5 MB request limit), then the server verifies the object (exists, ≤ 5 MB, real image magic bytes) and inserts the payment with the **server-side price of 50 EGP**.
3. **WhatsApp** — a button opens `wa.me/201552481349` with the message pre-filled (see below).
4. **Portal** — phone → OTP → own record only (RLS).

> **WhatsApp is not an automatic API message.** It opens WhatsApp with a ready text and the student must press *Send*. If you later connect the WhatsApp Business API, add a server-side integration (e.g. a Supabase Edge Function triggered on `payments` insert) — do not call it from the browser.

## Admin flow

```text
/admin login → Dashboard → Students → Payments → Payment proofs
```
Username (or email) + password → server verifies with Supabase Auth **and** checks `public.admins`. Non-admin accounts are rejected. All admin data is read with the admin's own session, so RLS decides what is returned.

Payment status model: `لم يتم الدفع` (student said not paid) · `قيد المراجعة` (paid, awaiting review — gold) · `مؤكد` (confirmed — green) · `مرفوض` (rejected — red). KPI "إجمالي المدفوعات المسجلة" counts paid, non-rejected payments.

## Deployment (GitHub + Vercel)

1. `git init && git add . && git commit -m "Virelo Academy System"` — `.gitignore` already excludes `.env*`, `node_modules`, `.next`.
2. Push to a **private** GitHub repository.
3. Vercel → *Add New Project* → import the repo (framework: Next.js, defaults are fine).
4. Add the four [environment variables](#environment-variables) in *Project Settings → Environment Variables* (`SUPABASE_SERVICE_ROLE_KEY` **not** public).
5. Deploy, then set the Vercel URL as **Site URL** in Supabase Auth.

`npm run build` passes (verified).

## Security

- **RLS everywhere**: anonymous role has *no* privileges on `students`, `payments`, `admins`. Admin = row in `admins` (`is_admin()`); a student may read/update only the row whose phone equals the OTP-verified phone in their JWT.
- **Public writes go through server actions** (validate → rate-limit → insert with service role). Amount is a server constant; the client can't send a price. Honeypot field on public forms.
- **Storage**: private bucket, signed upload URLs (server-issued), signed view URLs (admin only, 2 min), server-side magic-byte check, MIME + size limits at bucket level.
- **Student auth = SMS OTP** (phone alone is *not* accepted). The OTP is only requested for registered numbers, and the response is identical for unknown numbers (no phone enumeration).
- **Admin auth**: Supabase Auth password login; generic error message; login rate limiting; `getUser()` server verification on every protected render/action (not just middleware).
- **Secrets**: no passwords/keys in source; `.env.example` has placeholders only; service-role key is server-only.
- **Headers**: `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS.
- **CSV export** neutralises spreadsheet formula injection.
- **Known limits**: the in-memory rate limiter is per server instance (best-effort on serverless). For stronger protection add Vercel Firewall / Upstash rate limiting and Supabase CAPTCHA. A full Content-Security-Policy with nonces is a recommended next hardening step.

## Design system & customization

- Colors, radii, shadows, fonts → `app/globals.css` (`@theme`) and `design-system/tokens.ts`.
- **Logo** → overwrite `public/logo/virelo-logo.jpeg` (keep it **square**; it is displayed at its native aspect ratio, never recolored or stretched). `app/icon.png` / `apple-icon.png` are resized copies for the favicon.
- Prices, grades, WhatsApp number, social links, nav → `lib/config.ts`. Payment numbers/methods per grade → `lib/payment.ts`.
- The logo has its own (slightly darker) navy background, so it is shown as a rounded square tile rather than blended into the navbar.

## Assumptions & decisions

- **Student name** must contain at least 3 words ("الاسم الرباعي"), letters only. Loosen in `lib/validation.ts` if needed.
- **Sender number** is required only when the student selected *دفع*; optional otherwise.
- **WhatsApp button** appears only after a *paid* submission (the message says "تم دفع").
- **Student portal** always shows the same message after requesting a code (anti-enumeration) — students who mistype their number simply receive no code.
- **Payments are not linked** to `students` by foreign key (the spec's payment form is independent of registration); they match by phone.
- Phone numbers are **Egyptian mobiles** (`010/011/012/015`), stored as 11 digits and converted to `+20…` for OTP.
- Numbers/dates display with Latin digits (Montserrat), Gregorian calendar, Cairo time.
- Arabic UI copy provided in the brief is used verbatim; any additional Arabic microcopy was written for this project and should get a native-speaker review.

## Replace before launch

- [ ] Supabase project URL, anon key, service-role key (`.env.local` + Vercel)
- [ ] Two admin Auth users + `admins` rows (UUIDs) — `supabase/seed.sql`
- [ ] SMS provider for phone OTP (Twilio etc.) — or test numbers for staging
- [ ] Official logo file (currently the supplied image)
- [ ] Production Site URL in Supabase Auth + `NEXT_PUBLIC_SITE_URL`
- [ ] Confirm the payment numbers in `lib/payment.ts`

## Testing & what was verified

Run: `npm run typecheck && npm run lint && npm test && npm run build`.

Verified in development:
- ✅ TypeScript strict, ESLint, production build, 10 unit tests (validation, phone normalisation, paid/unpaid rules, per-grade payment instructions, WhatsApp message, CSV escaping, KPIs, search/filters, time series).
- ✅ SQL (`schema.sql`, `policies.sql`) executed on a local PostgreSQL 16 with stubbed `auth`/`storage` schemas, including re-run idempotency and RLS behaviour: anon denied; student sees/updates only own row; phone change blocked; students can't read payments/admins; admin can read/update all; constraints reject bad phone / duplicate phone / paid-without-proof.
- ✅ Headless-Chromium checks on the built site: all routes render RTL, no horizontal overflow at 375/390/1280/1440 px, per-grade payment instructions (InstaPay-only vs InstaPay + Orange Cash), proof field appears only for *paid*, Arabic validation messages, focus moves to the first invalid field, mobile menu, footer links.
- ✅ Admin dashboard UI (KPIs, charts, tables, search, filters) exercised with mock data.

**Not verified (needs your Supabase project):** real signups/OTP delivery, actual Storage uploads, signed URLs, admin login against real Auth, and end-to-end RLS through the Supabase API. Follow the setup steps, then run through the checklist below.

Manual acceptance checklist: register (valid / missing / duplicate / invalid phone) · pay for each grade (paid + unpaid, invalid file, WhatsApp text) · student portal (known / unknown phone, edit, save) · admin (login, logout, tables, search, filters, proof, status change, KPIs).

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| "الخدمة غير متاحة حالياً" on forms | Env vars missing/placeholder. Fill `.env.local` and restart `npm run dev`. |
| Registration says data can't be saved | `schema.sql` not run, or wrong `SUPABASE_SERVICE_ROLE_KEY`. Check server logs. |
| Student never receives the OTP | Phone provider/SMS not configured, number not registered, or SMS quota. Errors are logged server-side (`[sendStudentOtp]`) but deliberately not shown to users. Use *Test Phone Numbers* in Supabase for testing. |
| "رمز التحقق غير صحيح" right after receiving it | Code expired (see Auth → Phone → OTP expiry) or already used — request a new one. |
| Admin login always fails | User not in `public.admins`, username not lower-case, wrong password, or `SUPABASE_SERVICE_ROLE_KEY` missing (needed to resolve username → email). You can also type the admin's email. |
| Dashboard says "تعذر تحميل البيانات" | `policies.sql` not applied or the account isn't in `admins`. |
| Proof upload fails | Bucket `payment-proofs` missing (run `schema.sql`), file > 5 MB, or not JPG/PNG/WEBP. |
| Proof viewer says image unavailable | Storage policy `payment_proofs_admin_read` missing, or the file was deleted. |
| Build fails on fonts | Fonts are bundled from npm (`@fontsource-variable/*`); run `npm install` again. |
