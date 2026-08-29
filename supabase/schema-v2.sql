-- Safety Observation Card v2 — workflow lengkap (ISO 45001 / IOGP)
-- Jalankan di Supabase Dashboard → SQL Editor setelah schema awal sudah ada.
-- Aman dijalankan ulang (idempotent).

-- ─── 1. Kolom baru di observations ───────────────────────────────────────────

alter table public.observations add column if not exists is_hipo boolean not null default false;
alter table public.observations add column if not exists potential_risk_level text;
alter table public.observations add column if not exists life_saving_rule text;
alter table public.observations add column if not exists stop_work boolean not null default false;
alter table public.observations add column if not exists triage_notes text;
alter table public.observations add column if not exists investigation_notes text;
alter table public.observations add column if not exists root_cause text;
alter table public.observations add column if not exists verification_notes text;
alter table public.observations add column if not exists verified_at timestamptz;
alter table public.observations add column if not exists verified_by text;

-- Perluas status workflow (hapus constraint lama dulu)
alter table public.observations drop constraint if exists observations_status_check;
alter table public.observations add constraint observations_status_check
  check (status in (
    'Open',
    'Under Review',
    'In Progress',
    'Pending Verification',
    'Closed',
    'Rejected'
  ));

create index if not exists observations_is_hipo_idx on public.observations (is_hipo);
create index if not exists observations_life_saving_rule_idx on public.observations (life_saving_rule);

-- ─── 2. Tabel CAPA (Corrective & Preventive Action) ──────────────────────────

create table if not exists public.capa_actions (
  id uuid primary key default gen_random_uuid(),
  observation_id uuid not null references public.observations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  description text,
  owner text not null,
  due_date date,
  status text not null default 'Open' check (status in ('Open', 'In Progress', 'Completed', 'Verified')),
  completed_at timestamptz,
  verification_notes text
);

create index if not exists capa_observation_id_idx on public.capa_actions (observation_id);
create index if not exists capa_status_idx on public.capa_actions (status);
create index if not exists capa_due_date_idx on public.capa_actions (due_date);

drop trigger if exists trg_capa_updated_at on public.capa_actions;
create trigger trg_capa_updated_at
before update on public.capa_actions
for each row execute function public.set_updated_at();

-- ─── 3. Tabel audit trail ────────────────────────────────────────────────────

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  observation_id uuid references public.observations(id) on delete cascade,
  created_at timestamptz not null default now(),
  action text not null,
  details text,
  actor_email text
);

create index if not exists audit_observation_id_idx on public.audit_logs (observation_id);
create index if not exists audit_created_at_idx on public.audit_logs (created_at desc);

-- ─── 4. Row Level Security ───────────────────────────────────────────────────

alter table public.capa_actions enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "Authenticated can manage capa" on public.capa_actions;
create policy "Authenticated can manage capa"
on public.capa_actions for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated can view audit logs" on public.audit_logs;
create policy "Authenticated can view audit logs"
on public.audit_logs for select to authenticated using (true);

drop policy if exists "Authenticated can insert audit logs" on public.audit_logs;
create policy "Authenticated can insert audit logs"
on public.audit_logs for insert to authenticated with check (true);

-- Pelapor publik boleh insert audit saat submit (opsional)
drop policy if exists "Public can insert submit audit" on public.audit_logs;
create policy "Public can insert submit audit"
on public.audit_logs for insert to anon
with check (action = 'Laporan dikirim');
