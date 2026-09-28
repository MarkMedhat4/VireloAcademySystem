# Virelo Academy System

> **لا ننافس على الجودة. نقودها.** — *WE DON'T COMPETE ON QUALITY. WE LEAD IT.*

A real, working web system for **Virelo Academy**: student registration, payment registration with proof-of-payment upload, an phone-based student portal, and an admin dashboard — built with **Next.js + TypeScript + Tailwind CSS** on **Supabase** (PostgreSQL, Auth, Storage, Row Level Security).

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
11. [Form Builder](#form-builder)
12. [Deployment (GitHub + Vercel)](#deployment-github--vercel)
13. [Security](#security)
14. [Design system & customization](#design-system--customization)
15. [Assumptions & decisions](#assumptions--decisions)
16. [Replace before launch](#replace-before-launch)
17. [Testing & what was verified](#testing--what-was-verified)
18. [Known limitations](#known-limitations)
19. [Troubleshooting](#troubleshooting)

---

## Features

**Public**
- **Home** — premium landing page with the three entry cards (registration, payment, student portal).
- **`/register`** — student registration (name, phone, guardian name/phone, grade). Server-side validation, duplicate-phone protection, Arabic error messages.
- **`/payment`** — lesson payment (50 EGP). **Payment instructions change instantly with the selected grade** (1st secondary → InstaPay only; 2nd secondary → InstaPay + Orange Cash). "Paid" requires a proof image (JPG/PNG/WEBP, ≤ 5 MB) uploaded to a **private** bucket. After a paid submission the student gets a **pre-filled WhatsApp message** to `01552481349`.
- **`/student`** — student portal: the student types their registered phone number and sees **only their own record**, which they can edit (name, guardian name/phone, grade). No OTP / SMS / authenticator app. The student's phone number itself is read-only.

- **`/forms/<slug>`** — public dynamic forms created by the admins with the Form Builder (see [Form Builder](#form-builder)). One engine renders every form; drafts are never public.

**The public site never links to the admin area.** The navbar, footer, home page and every student-facing page contain no "Admin" text or `/admin` link. `/admin` still exists and is protected by real authentication (hiding a link is not security). `robots.txt` disallows `/admin`, and every admin page sends `noindex`.

**Admin (`/admin`, a separate experience with its own layout — no public navbar/footer)**
- Login with username (or email) + password through Supabase Auth; only accounts listed in `public.admins` get in. Signed-in admins are sent to `/admin/dashboard`.
- Routes: `/admin/dashboard`, `/admin/students`, `/admin/payments`, `/admin/forms`, `/admin/forms/create`, `/admin/forms/[id]`, `/admin/forms/[id]/responses`, `/admin/attendance` (placeholder), `/admin/settings` (basic).
- Dashboard: KPI cards (students, payments, revenue, pending review, forms, form responses), four Recharts charts, recent forms, recent form responses, recent payments.
- Students and Payments pages: Arabic-normalised search, grade / status / date filters, sorting, pagination, CSV export.
- View a payment proof through a **2-minute signed URL**; confirm / reject payments.
- **Form Builder**: create, edit, preview, publish, archive/restore, duplicate forms; view, search, filter and export responses.

**Quality**: skeleton loading, empty states, Arabic errors, accessible forms (labels, focus, `aria-*`), 44 px touch targets, `prefers-reduced-motion`, responsive from 320 px, security headers.

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript (strict) |
| Styling | Tailwind CSS v4 + centralised tokens (`app/globals.css`, `design-system/tokens.ts`) |
| Icons | Lucide (UI) + Simple Icons (brand glyphs) |
| Fonts | Cairo (Arabic) + Montserrat (Latin/numbers) via Fontsource (self-hosted, no Google request) |
| Backend | Supabase: PostgreSQL, Auth (admin password login), Storage, RLS |
| Validation | Zod (shared by browser and server) |
| Charts | Recharts |
| Hosting | GitHub → Vercel, Supabase cloud |

## Project structure

```text
virelo-academy-system/
├── app/
│   ├── layout.tsx            # <html lang="ar" dir="rtl">, navbar, footer
│   ├── page.tsx              # Home
│   ├── register/  payment/  student/
│   ├── forms/[slug]/         # Public dynamic form page
│   ├── actions/              # Server actions: register, payment, student portal, public forms
│   ├── admin/page.tsx        # Login (redirects to /admin/dashboard when signed in)
│   ├── admin/(shell)/        # Auth-guarded layout + dashboard, students, payments, forms/*, attendance, settings
│   ├── admin/actions.ts      # Server actions: login/logout, signed proof URL, payment status
│   ├── admin/forms-actions.ts# Server actions: form builder (admin only)
│   ├── robots.ts             # Disallows /admin for crawlers
│   ├── globals.css           # Design tokens + motion
│   └── not-found.tsx, error.tsx, */loading.tsx
├── components/
│   ├── ui/                   # Button, Card, Badge, Alert, Field, Skeleton, EmptyState
│   ├── forms/                # RegisterForm, PaymentForm, StudentPortal, DynamicFormRenderer, PublicFormClient
│   ├── dashboard/            # AdminChrome, views (dashboard/students/payments/forms/responses), form-builder/*
│   ├── tables/               # DataTable, StudentsTable, PaymentsTable
│   └── site/                 # Navbar, Footer, SiteChrome (hides public chrome on /admin), Logo, PageShell
├── design-system/tokens.ts   # Colors, spacing, radii, motion
├── lib/                      # config, validation, forms (builder types + response validation), payment, analytics, csv, auth, supabase clients, env
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
- **Phone** — *not needed*. The student portal does not use SMS or OTP, so no Twilio/SMS provider is required.
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
| `SUPABASE_SERVICE_ROLE_KEY` | **NO — server only** | Bypasses RLS. Used inside server actions after validation (registration, payment, student portal, admin username lookup). Also the secret that signs the student-portal session cookie. **Never** prefix with `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_SITE_URL` | yes | Canonical site URL (metadata) |

## Database

| Table | Purpose | Key columns |
| --- | --- | --- |
| `students` | Registered students | `id, student_name, student_phone (UNIQUE), guardian_name, guardian_phone, grade, created_at, updated_at` |
| `payments` | Payment declarations | `id, student_name, student_phone, sender_number, grade, amount (default 50), paid, status, proof_path, reviewed_at, created_at` |
| `admins` | Which Auth users are administrators | `user_id → auth.users, username, full_name` |
| `forms` | Form Builder: one row per form | `id, name, title, description, slug (UNIQUE), status (draft/published/archived), settings (jsonb), created_by, created_at, updated_at, published_at` |
| `form_fields` | Fields of a form | `id, form_id, field_key, label, type, placeholder, description, required, validation (jsonb), options (jsonb), default_value, sort_order` |
| `form_responses` | Submissions (JSONB, keyed by `field_key`) | `id, form_id, submitted_at, response_data (jsonb), created_at` |

Integrity is enforced in the database too: Egyptian mobile format (`01[0125]xxxxxxxx`), the four allowed grades, name lengths, and "a *paid* payment must have a proof and a sender number". `students.updated_at` is maintained by a trigger, and a signed-in non-admin can never change `student_phone`.

## Storage

Bucket **`payment-proofs`** — private, 5 MB, `image/jpeg | image/png | image/webp`. Object names are server-generated (`yyyy/mm/<uuid>.<ext>`). No public URLs exist: admins view proofs via `createSignedUrl` (120 s).

## Student flow

```text
/register  →  /payment  →  upload proof  →  WhatsApp message  →  /student (phone)
```
1. **Register** — data validated in the browser (UX) and again on the server; stored with the service role because anonymous users have no table access.
2. **Pay** — choose the grade → matching instructions appear. If *paid*: the browser asks the server for a one-time **signed upload URL**, uploads the image **directly to Supabase Storage** (avoids Vercel's 4.5 MB request limit), then the server verifies the object (exists, ≤ 5 MB, real image magic bytes) and inserts the payment with the **server-side price of 50 EGP**.
3. **WhatsApp** — a button opens `wa.me/201552481349` with the message pre-filled (see below).
4. **Portal** — phone number → the server finds that one record and binds the browser to it with a signed, httpOnly cookie (30 min). Edits are applied to that record only.

> **WhatsApp is not an automatic API message.** It opens WhatsApp with a ready text and the student must press *Send*. If you later connect the WhatsApp Business API, add a server-side integration (e.g. a Supabase Edge Function triggered on `payments` insert) — do not call it from the browser.

## Admin flow

```text
/admin login → Dashboard → Students → Payments (+ proofs) → Forms → Responses
```
Username (or email) + password → server verifies with Supabase Auth **and** checks `public.admins`. Non-admin accounts are rejected. All admin data is read with the admin's own session, so RLS decides what is returned.

Payment status model: `لم يتم الدفع` (student said not paid) · `قيد المراجعة` (paid, awaiting review — gold) · `مؤكد` (confirmed — green) · `مرفوض` (rejected — red). KPI "إجمالي المدفوعات المسجلة" counts paid, non-rejected payments.

## Form Builder

Admins can create any form from the dashboard without code. Every form, field and response lives in Supabase; **no table is created per form** — one dynamic engine renders all of them.

### Migration / setup (existing projects)
1. Open Supabase → **SQL Editor** and run the updated `supabase/schema.sql`, then `supabase/policies.sql` (both idempotent — safe to re-run; existing tables and data are untouched).
2. No new environment variables are needed.
3. Push to GitHub; Vercel redeploys automatically.

### Create a form
1. Sign in at `/admin` → **النماذج** → **+ إنشاء نموذج**.
2. Fill **اسم النموذج** (internal), **العنوان** (shown to students), optional description and the **slug** (auto-suggested from a Latin title; edit it freely — lowercase letters, numbers and dashes; must be unique).
3. **+ إضافة حقل** → pick a type, then edit it in the settings panel: label, placeholder, help text, required, min/max length (text) or min/max value (number), options (dropdown / radio / checkbox group), default value.
4. Reorder with the up/down arrows, duplicate or delete fields from the row.
5. **معاينة** shows the real public form (same renderer) without saving or submitting.
6. **حفظ كمسودة** saves as a draft (not public).

### Publish and share
Click **نشر**. The public URL `https://<your-domain>/forms/<slug>` appears with **Copy Link**, **Open Form** and **Responses** buttons. Editing a published form uses **حفظ التغييرات** (status is unchanged). **أرشفة** stops responses (the public page then says the form no longer accepts responses) and keeps all data; **استعادة** returns it to draft.

### View, search, filter, export responses
`/admin/forms/<id>/responses` shows total / today / this week / last submission, then a table whose columns are generated from the form's fields. Search covers every value (Arabic-normalised), filter by date range, click **عرض** for the full response, and **تصدير CSV** exports the filtered rows using the real field labels as column headers. CSV opens directly in Excel (UTF-8 with BOM, formula-injection safe).

### Duplicate
**تكرار** copies the structure, fields, options and settings into a new draft (slug `<old>-copy`); responses are never copied.

### Safe editing
Responses are stored with their own snapshot keyed by an internal, stable `field_key` — never by label. Renaming, editing or deleting a field cannot damage historical responses (a removed field's old values simply stay stored).

### Supported field types
Short text, long text, number, phone, email, date, dropdown, radio, checkbox group, section/heading, divider. Required fields and formats are validated in the browser **and again on the server** (`lib/forms.ts → validateResponse`).

### Form settings
Each form stores `accept_responses` and a custom `success_message` (default: "تم إرسال بياناتك بنجاح. شكرًا لانضمامك إلى Virelo Academy."). The server enforces them; the builder UI does not yet expose editing controls for them (see limitations).

## Deployment (GitHub + Vercel)

1. `git init && git add . && git commit -m "Virelo Academy System"` — `.gitignore` already excludes `.env*`, `node_modules`, `.next`.
2. Push to a **private** GitHub repository.
3. Vercel → *Add New Project* → import the repo (framework: Next.js, defaults are fine).
4. Add the four [environment variables](#environment-variables) in *Project Settings → Environment Variables* (`SUPABASE_SERVICE_ROLE_KEY` **not** public).
5. Deploy, then set the Vercel URL as **Site URL** in Supabase Auth.

`npm run build` passes (verified).

## Security

- **RLS everywhere**: anonymous role has *no* privileges on `students`, `payments`, `admins`. Admin = row in `admins` (`is_admin()`); students have **no direct table access**; the portal goes through server actions.
- **Public writes go through server actions** (validate → rate-limit → insert with service role). Amount is a server constant; the client can't send a price. Honeypot field on public forms.
- **Storage**: private bucket, signed upload URLs (server-issued), signed view URLs (admin only, 2 min), server-side magic-byte check, MIME + size limits at bucket level.
- **Student portal = phone number only (by design, no OTP).** The server returns exactly one record per lookup, never a list; the browser is bound to that record by an HMAC-signed, httpOnly, SameSite cookie that expires after 30 minutes; edits use the id from that cookie, never from the request; lookups are rate-limited. Be aware that anyone who knows a student's phone number can open that student's record, so the page exposes only name, phones, guardian and grade. If you later need stronger protection, add OTP or a PIN.
- **Form Builder security**: `forms`, `form_fields`, `form_responses` have RLS enabled, no anonymous privileges, and one admin-only policy each. Public form pages and submissions run through server actions (service role) that re-check that the form is published and accepting responses and re-validate every field on the server — the browser is never trusted. Public visitors cannot read form configuration of unpublished forms or any responses. Verified with simulated roles in PostgreSQL (anon denied, non-admin sees nothing, admin full access).
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
- **Student portal** is phone-number-only as requested (no OTP/SMS). An unknown number gets a clear "not registered" message.
- **Payments are not linked** to `students` by foreign key (the spec's payment form is independent of registration); they match by phone.
- Phone numbers are **Egyptian mobiles** (`010/011/012/015`), stored as 11 digits.
- Numbers/dates display with Latin digits (Montserrat), Gregorian calendar, Cairo time.
- Arabic UI copy provided in the brief is used verbatim; any additional Arabic microcopy was written for this project and should get a native-speaker review.

## Replace before launch

- [ ] Supabase project URL, anon key, service-role key (`.env.local` + Vercel)
- [ ] Two admin Auth users + `admins` rows (UUIDs) — `supabase/seed.sql`
- [ ] Official logo file (currently the supplied image)
- [ ] Production Site URL in Supabase Auth + `NEXT_PUBLIC_SITE_URL`
- [ ] Confirm the payment numbers in `lib/payment.ts`

## Testing & what was verified

Run: `npm run typecheck && npm run lint && npm test && npm run build`.

Verified in development:
- ✅ TypeScript strict, ESLint, production build, 16 unit tests (validation, phone normalisation, student session token, form slugs, dynamic response validation, paid/unpaid rules, per-grade payment instructions, WhatsApp message, CSV escaping, KPIs, search/filters, time series).
- ✅ SQL (`schema.sql`, `policies.sql`) executed on a local PostgreSQL 16 with stubbed `auth`/`storage` schemas, including re-run idempotency and RLS behaviour: anon denied; a signed-in non-admin sees nothing; admin can read/update all (including forms, fields and responses); constraints reject bad phone / duplicate phone / paid-without-proof.
- ✅ Headless-Chromium checks on the built site: all routes render RTL, no horizontal overflow at 375/390/1280/1440 px, per-grade payment instructions (InstaPay-only vs InstaPay + Orange Cash), proof field appears only for *paid*, Arabic validation messages, focus moves to the first invalid field, mobile menu, footer links.
- ✅ Admin dashboard UI (KPIs, charts, tables, search, filters) exercised with mock data.

**Not verified (needs your Supabase project):** the student portal against the real database, actual Storage uploads, signed URLs, admin login against real Auth, and end-to-end RLS through the Supabase API. Follow the setup steps, then run through the checklist below.

Manual acceptance checklist: register (valid / missing / duplicate / invalid phone) · pay for each grade (paid + unpaid, invalid file, WhatsApp text) · student portal (known / unknown phone, edit, save, logout) · admin (login, logout, tables, search, filters, proof, status change, KPIs).

## Known limitations

Be aware of what this version does **not** do (listed honestly so nothing is assumed to work):

- **Attendance** (`/admin/attendance`) is a placeholder page — no attendance data model or UI exists yet.
- **Settings** (`/admin/settings`) shows the account only; there are no editable system settings yet.
- **Field types not implemented:** file upload, image upload, password, URL, time, date & time. ("Multiple choice" is the same as radio.)
- **Field options not implemented:** "unique value" per field, regex/pattern validation.
- **Form settings not implemented:** "require login", "allow multiple submissions" and "show submission date" toggles. `accept_responses` and `success_message` are enforced by the server but have no editor in the UI yet.
- **Reordering** uses up/down buttons, not drag-and-drop. The builder is a two-column layout (fields list + settings panel), with a field-type picker dialog instead of a permanent left palette.
- **No QR code** and **no separate Excel (.xlsx) or PDF export** — CSV only (opens in Excel).
- **"View" action:** the form list has Edit / Responses / Open / Copy link / Duplicate / Archive; there is no separate read-only "View" page (Edit includes Preview).
- **Existing hard-coded forms** (registration, payment, student portal) were **not** migrated to the Form Builder, by design (no safe automatic migration).
- **Public-page redesign:** the navbar/footer were cleaned (no admin link) and the pages keep the existing premium design, but the larger UI overhaul in the brief (new hero copy, trust section, student-journey timeline, payment step flow, student dashboard cards, scroll-reveal animations) was **not** implemented in this pass.
- **Not verified against a live Supabase project:** the Form Builder server actions, public submission and the admin screens with real data were type-checked, linted, unit-tested and the SQL/RLS were tested on local PostgreSQL, but the end-to-end flow (login → build → publish → submit → responses → export) has not been run against a real Supabase instance. Run the acceptance flow below after setup.
- Rate limiting is in-memory per server instance (see Security).

### Acceptance checklist for the Form Builder
Admin login → **+ إنشاء نموذج** → fill info → add fields → configure → reorder → preview → save draft → publish → copy URL → open it in a private window → submit (also try missing required fields) → responses page shows it → search → date filter → open detail → export CSV → duplicate → archive (public page shows "no longer accepting") → restore.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| "الخدمة غير متاحة حالياً" on forms | Env vars missing/placeholder. Fill `.env.local` and restart `npm run dev`. |
| Registration says data can't be saved | `schema.sql` not run, or wrong `SUPABASE_SERVICE_ROLE_KEY`. Check server logs. |
| Student portal says "لا توجد بيانات مسجلة بهذا الرقم" | The phone isn't in `students`, or was typed differently. The number is normalised (`+20…`, Arabic digits are accepted). |
| Student portal says the session expired while saving | The 30-minute cookie expired — enter the phone number again. |
| Admin login always fails | User not in `public.admins`, username not lower-case, wrong password, or `SUPABASE_SERVICE_ROLE_KEY` missing (needed to resolve username → email). You can also type the admin's email. |
| Dashboard says "تعذر تحميل البيانات" | `policies.sql` not applied or the account isn't in `admins`. |
| Proof upload fails | Bucket `payment-proofs` missing (run `schema.sql`), file > 5 MB, or not JPG/PNG/WEBP. |
| Proof viewer says image unavailable | Storage policy `payment_proofs_admin_read` missing, or the file was deleted. |
| Build fails on fonts | Fonts are bundled from npm (`@fontsource-variable/*`); run `npm install` again. |
| Public form says "لا يوجد نموذج بهذا الرابط" | The form is still a draft, the slug is different, or `schema.sql` (forms tables) wasn't run. Publish it and copy the link from the builder. |
| Admin dashboard fails after the update | Run the new `schema.sql` and `policies.sql` (forms tables + policies). |
| Publishing says to add a field | A form needs at least one input field (headings and dividers don't count). |
