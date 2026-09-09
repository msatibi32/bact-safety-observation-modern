-- v8: Revisi HSE — investigasi terstruktur, PDF meta, nomor SOC, activity log
-- Jalankan di Supabase SQL Editor setelah backup.

alter table public.observations
  add column if not exists investigation_data jsonb,
  add column if not exists finding_observation text,
  add column if not exists pdf_to text,
  add column if not exists pdf_pic text,
  add column if not exists requires_investigation boolean default false,
  add column if not exists soc_number text,
  add column if not exists investigator_name text;

comment on column public.observations.investigation_data is 'JSON 5W+1H + 5 Whys + CA';
comment on column public.observations.requires_investigation is 'HSE menandai SOC lanjut investigasi (tidak semua wajib)';
comment on column public.observations.soc_number is 'Contoh: SOC-0001-BACT-HSSE-IX-2026';
comment on column public.observations.pdf_to is 'Kepada/To manual untuk PDF Notice';
comment on column public.observations.pdf_pic is 'PIC/Assigned manual untuk PDF Notice';

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_email text,
  actor_role text,
  action text not null,
  details text,
  observation_id uuid references public.observations (id) on delete set null
);

create index if not exists activity_logs_created_at_idx on public.activity_logs (created_at desc);
create index if not exists activity_logs_actor_idx on public.activity_logs (actor_email);

alter table public.activity_logs enable row level security;

drop policy if exists "activity_logs_select_auth" on public.activity_logs;
create policy "activity_logs_select_auth" on public.activity_logs
  for select to authenticated using (true);

drop policy if exists "activity_logs_insert_auth" on public.activity_logs;
create policy "activity_logs_insert_auth" on public.activity_logs
  for insert to authenticated with check (true);
