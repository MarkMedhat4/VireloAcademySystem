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

-- ── students: keep updated_at fresh and protect immutable columns ─
create or replace function public.students_before_update()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  -- Any signed-in non-admin can never change identity columns (defence in depth).
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

-- ════════════════════════════════════════════════════════════════
-- Virelo Form Builder — forms, form_fields, form_responses.
-- One dynamic engine for every form: no new table is created per form.
-- ════════════════════════════════════════════════════════════════

do $$ begin
  create type public.form_status as enum ('draft', 'published', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.form_field_type as enum (
    'short_text', 'long_text', 'number', 'phone', 'email', 'date',
    'dropdown', 'radio', 'checkbox_group', 'section', 'divider'
  );
exception when duplicate_object then null; end $$;

-- ── forms ───────────────────────────────────────────────────────
create table if not exists public.forms (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(btrim(name)) between 2 and 150),
  title        text not null check (char_length(btrim(title)) between 2 and 200),
  description  text,
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 2 and 80),
  status       public.form_status not null default 'draft',
  settings     jsonb not null default '{"accept_responses": true, "success_message": "تم إرسال بياناتك بنجاح.\nشكرًا لانضمامك إلى Virelo Academy."}'::jsonb,
  created_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  published_at timestamptz
);
create index if not exists forms_status_idx on public.forms (status);

-- ── form_fields ─────────────────────────────────────────────────
-- field_key is a stable internal id (independent of the editable label) so that renaming
-- a label never breaks previously stored responses, which are keyed by field_key.
create table if not exists public.form_fields (
  id             uuid primary key default gen_random_uuid(),
  form_id        uuid not null references public.forms (id) on delete cascade,
  field_key      text not null check (field_key ~ '^[a-z0-9_]+$'),
  label          text not null,
  type           public.form_field_type not null,
  placeholder    text,
  description    text,
  required       boolean not null default false,
  validation     jsonb not null default '{}'::jsonb,
  options        jsonb, -- string[] for dropdown / radio / checkbox_group, else null
  default_value  text,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (form_id, field_key)
);
create index if not exists form_fields_form_id_idx on public.form_fields (form_id, sort_order);

-- ── form_responses ──────────────────────────────────────────────
-- response_data is keyed by field_key, e.g. {"f_1a2b3c4d": "Ahmed Mohamed"}.
-- Deliberately no foreign key to a "student" — forms are general-purpose, not only for students.
create table if not exists public.form_responses (
  id             uuid primary key default gen_random_uuid(),
  form_id        uuid not null references public.forms (id) on delete cascade,
  submitted_at   timestamptz not null default now(),
  response_data  jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);
create index if not exists form_responses_form_id_idx on public.form_responses (form_id, created_at desc);

create or replace function public.forms_before_update()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists forms_before_update on public.forms;
create trigger forms_before_update before update on public.forms for each row execute function public.forms_before_update();

create or replace function public.form_fields_before_update()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists form_fields_before_update on public.form_fields;
create trigger form_fields_before_update before update on public.form_fields for each row execute function public.form_fields_before_update();
