-- ════════════════════════════════════════════════════════════════
-- Virelo Academy System — Row Level Security
-- Run AFTER schema.sql.
--
-- Model:
--   • Anonymous visitors have NO direct table access at all. Public registration and
--     payment go through server actions (service role, validated server-side).
--   • Admins (row in public.admins) can read and manage everything.
--   • The student portal also runs through server actions (service role): the server looks up ONE
--     record by phone and binds the browser to it with a signed, httpOnly cookie. Students have
--     no direct table access, so they can never list or browse other students.
-- ════════════════════════════════════════════════════════════════

alter table public.admins   enable row level security;
alter table public.students enable row level security;
alter table public.payments enable row level security;

-- Defence in depth: the anon role gets no privileges on these tables.
revoke all on public.admins, public.students, public.payments from anon;
grant select, insert, update, delete on public.students, public.payments to authenticated; -- RLS still applies: only admins pass
grant select on public.admins to authenticated;

-- ── admins: a user may only see their own admin row (no write policies) ──
drop policy if exists admins_self_read on public.admins;
create policy admins_self_read on public.admins
  for select to authenticated
  using (user_id = (select auth.uid()));

-- ── students ────────────────────────────────────────────────────
drop policy if exists students_admin_all on public.students;
create policy students_admin_all on public.students
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ── payments (admin only; students never read payment rows directly) ──
drop policy if exists payments_admin_all on public.payments;
create policy payments_admin_all on public.payments
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ── Storage: payment-proofs ─────────────────────────────────────
-- Uploads happen through server-issued signed upload URLs (no INSERT policy needed).
-- Only admins can read (create signed view URLs for) or delete proofs.
drop policy if exists payment_proofs_admin_read on storage.objects;
create policy payment_proofs_admin_read on storage.objects
  for select to authenticated
  using (bucket_id = 'payment-proofs' and (select public.is_admin()));

drop policy if exists payment_proofs_admin_delete on storage.objects;
create policy payment_proofs_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'payment-proofs' and (select public.is_admin()));
