-- ════════════════════════════════════════════════════════════════
-- Virelo Academy System — database schema
-- Run order:  1) schema.sql   2) policies.sql   3) seed.sql (admins)
-- Safe to re-run: statements are idempotent where possible.
-- ════════════════════════════════════════════════════════════════

-- ── Domains ─────────────────────────────────────────────────────
do $$ begin
  create domain public.eg_mobile as text
    check (value ~ '^01[0125][0-9]{8}$');
exception when duplicate_object then null; end $$;

do $$ begin
  create domain public.virelo_grade as text
    check (value in (
      'الصف الأول الثانوي عربي',
      'الصف الأول الثانوي لغات',
      'الصف الثاني الثانوي عربي',
      'الصف الثاني الثانوي لغات'
    ));
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum ('pending', 'paid', 'rejected');
exception when duplicate_object then null; end $$;

-- ── admins ──────────────────────────────────────────────────────
-- One row per administrator. The Auth account itself (email + password) lives ONLY in
-- Supabase Auth — never here, never in source control. See seed.sql for how to link it.
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  username   text not null check (username = lower(username) and char_length(username) between 3 and 60),
  full_name  text,
  created_at timestamptz not null default now()
);
create unique index if not exists admins_username_key on public.admins (username);

-- ── students ────────────────────────────────────────────────────
create table if not exists public.students (
  id             uuid primary key default gen_random_uuid(),
  student_name   text not null check (char_length(btrim(student_name)) between 6 and 100),
  student_phone  public.eg_mobile not null unique,
  guardian_name  text not null check (char_length(btrim(guardian_name)) between 3 and 100),
  guardian_phone public.eg_mobile not null,
  grade          public.virelo_grade not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists students_created_at_idx on public.students (created_at desc);
create index if not exists students_grade_idx on public.students (grade);

-- ── payments ────────────────────────────────────────────────────
create table if not exists public.payments (
  id            uuid primary key default gen_random_uuid(),
  student_name  text not null check (char_length(btrim(student_name)) between 6 and 100),
  student_phone public.eg_mobile not null,
  sender_number public.eg_mobile,
  grade         public.virelo_grade not null,
  amount        integer not null default 50 check (amount > 0),
  paid          boolean not null default false,
  status        public.payment_status not null default 'pending',
  proof_path    text unique,
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now(),
  -- A payment declared as "paid" must have a sender number and a proof image.
  constraint payments_paid_requires_proof check (not paid or (proof_path is not null and sender_number is not null))
);
create index if not exists payments_created_at_idx on public.payments (created_at desc);
create index if not exists payments_grade_idx on public.payments (grade);
create index if not exists payments_student_phone_idx on public.payments (student_phone);

-- ── Helper functions ────────────────────────────────────────────

-- True when the signed-in user has a row in public.admins.
-- SECURITY DEFINER so RLS policies on other tables can call it without recursion.
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Phone of the signed-in (OTP-verified) user in local Egyptian format (01xxxxxxxxx).
-- Supabase stores the phone as E.164 without "+": 201012345678  →  01012345678
create or replace function public.auth_local_phone()
returns text
language sql stable
as $$
  select case
    when p is null or p = '' then null
    else '0' || right(regexp_replace(p, '\D', '', 'g'), 10)
  end
  from (select auth.jwt() ->> 'phone' as p) s;
$$;
grant execute on function public.auth_local_phone() to authenticated;

-- ── students: keep updated_at fresh and protect immutable columns ─
create or replace function public.students_before_update()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  -- A signed-in student (non-admin) can never change identity columns.
  if auth.uid() is not null and not public.is_admin() then
    if new.id is distinct from old.id
       or new.student_phone is distinct from old.student_phone
       or new.created_at is distinct from old.created_at then
      raise exception 'immutable_column' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists students_before_update on public.students;
create trigger students_before_update
  before update on public.students
  for each row execute function public.students_before_update();

-- ── Storage bucket for payment proofs (PRIVATE) ─────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
