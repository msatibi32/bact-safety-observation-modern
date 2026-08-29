-- v4 — daftar email notifikasi (kelola dari dashboard admin → Notifikasi)
-- Jalankan sekali di Supabase SQL Editor

create table if not exists public.notification_recipients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null unique,
  label text,
  active boolean not null default true,
  notify_new_report boolean not null default true,
  notify_hipo boolean not null default true
);

insert into public.notification_recipients (email, label) values
  ('chibiajjh12@gmail.com', 'HSE Utama')
on conflict (email) do nothing;

alter table public.notification_recipients enable row level security;

drop policy if exists "Authenticated can read notification recipients" on public.notification_recipients;
create policy "Authenticated can read notification recipients"
on public.notification_recipients for select to authenticated using (true);

drop policy if exists "Authenticated can manage notification recipients" on public.notification_recipients;
create policy "Authenticated can manage notification recipients"
on public.notification_recipients for all to authenticated using (true) with check (true);
