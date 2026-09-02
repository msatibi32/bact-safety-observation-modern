-- =============================================================================
-- BACT Safety Observation Card — SCHEMA LENGKAP (sekali run, aman diulang)
-- Jalankan di Supabase Dashboard → SQL Editor → Run
-- Tidak menghapus data yang sudah ada.
-- =============================================================================

-- ─── 0. Helper: auto-update updated_at ───────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── 1. Tabel utama: observations ────────────────────────────────────────────

create table if not exists public.observations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reporter_name text not null,
  reporter_position text not null,
  company_name text,
  incident_datetime timestamptz not null,
  location_text text not null,
  latitude double precision,
  longitude double precision,
  category text not null,
  description text not null,
  risk_level text not null default 'Medium',
  photo_urls text[] not null default '{}',
  immediate_action text,
  recommendation text,
  assigned_pic text,
  status text not null default 'Open',
  closing_notes text,
  closed_date date
);

-- Kolom v2 (HiPo, investigasi, workflow)
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

-- Kolom v3 (anonim, eskalasi)
alter table public.observations add column if not exists is_anonymous boolean not null default false;
alter table public.observations add column if not exists reporter_employee_id text;
alter table public.observations add column if not exists escalated boolean not null default false;
alter table public.observations add column if not exists escalation_due_at timestamptz;

-- Constraint status workflow lengkap
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

alter table public.observations drop constraint if exists observations_category_check;
alter table public.observations add constraint observations_category_check
  check (category in (
    'Unsafe Act',
    'Unsafe Condition',
    'Near Miss',
    'Positive Observation',
    'Belum diklasifikasi',
    'Observasi'
  ));

alter table public.observations drop constraint if exists observations_risk_level_check;
alter table public.observations add constraint observations_risk_level_check
  check (risk_level in ('Unclassified', 'Low', 'Medium', 'High'));

create index if not exists observations_created_at_idx on public.observations (created_at desc);
create index if not exists observations_status_idx on public.observations (status);
create index if not exists observations_risk_level_idx on public.observations (risk_level);
create index if not exists observations_is_hipo_idx on public.observations (is_hipo);
create index if not exists observations_life_saving_rule_idx on public.observations (life_saving_rule);
create index if not exists observations_escalation_idx on public.observations (escalation_due_at)
  where escalated = false and status not in ('Closed', 'Rejected');

drop trigger if exists trg_observations_updated_at on public.observations;
create trigger trg_observations_updated_at
before update on public.observations
for each row execute function public.set_updated_at();

-- ─── 2. CAPA (Corrective & Preventive Action) ────────────────────────────────

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

-- ─── 3. Audit trail (tab Audit di admin) ─────────────────────────────────────

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

-- ─── 4. KPI targets ──────────────────────────────────────────────────────────

create table if not exists public.kpi_targets (
  id uuid primary key default gen_random_uuid(),
  metric text not null unique,
  label text not null,
  target_value numeric not null,
  period text not null default 'monthly' check (period in ('monthly', 'weekly', 'yearly')),
  updated_at timestamptz not null default now()
);

insert into public.kpi_targets (metric, label, target_value, period) values
  ('monthly_reports', 'Laporan per bulan', 30, 'monthly'),
  ('positive_ratio', 'Rasio positif (%)', 20, 'monthly'),
  ('avg_close_days', 'Rata-rata hari tutup', 7, 'monthly'),
  ('hipo_response_hours', 'Respon HiPo (jam)', 24, 'monthly')
on conflict (metric) do nothing;

-- ─── 5. Notification queue (email / WA / dashboard) ──────────────────────────

create table if not exists public.notification_queue (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  type text not null,
  payload jsonb not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  sent_at timestamptz,
  error_message text
);

create index if not exists notification_queue_pending_idx on public.notification_queue (status, created_at)
  where status = 'pending';

-- ─── 5b. Daftar email penerima notifikasi (kelola via dashboard) ───────────────

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

-- ─── 6. Trigger notifikasi setiap laporan baru ───────────────────────────────

create or replace function public.on_observation_insert_notify()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notification_queue (type, payload) values (
    case when new.is_hipo then 'hipo_alert' else 'new_report' end,
    jsonb_build_object(
      'observation_id', new.id,
      'category', new.category,
      'risk_level', new.risk_level,
      'location', coalesce(new.location_text, '—'),
      'reporter', case when new.is_anonymous then 'Anonim' else new.reporter_name end,
      'is_hipo', coalesce(new.is_hipo, false),
      'company', coalesce(new.company_name, '—'),
      'channels', jsonb_build_array('email', 'whatsapp', 'dashboard')
    )
  );

  if new.is_hipo then
    new.escalation_due_at := coalesce(new.escalation_due_at, new.created_at + interval '24 hours');
  end if;

  return new;
end;
$$;

drop trigger if exists trg_observation_v3_insert on public.observations;
drop trigger if exists trg_observation_notify on public.observations;
create trigger trg_observation_notify
before insert on public.observations
for each row execute function public.on_observation_insert_notify();

-- ─── 7. Storage bucket foto bukti ────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'evidence-photos',
  'evidence-photos',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ─── 8. Row Level Security ───────────────────────────────────────────────────

alter table public.observations enable row level security;
alter table public.capa_actions enable row level security;
alter table public.audit_logs enable row level security;
alter table public.kpi_targets enable row level security;
alter table public.notification_queue enable row level security;
alter table public.notification_recipients enable row level security;

-- observations
drop policy if exists "Public can submit observations" on public.observations;
create policy "Public can submit observations"
on public.observations for insert to anon, authenticated
with check (true);

drop policy if exists "Authenticated can read observations" on public.observations;
create policy "Authenticated can read observations"
on public.observations for select to authenticated
using (true);

drop policy if exists "Authenticated can update observations" on public.observations;
create policy "Authenticated can update observations"
on public.observations for update to authenticated
using (true) with check (true);

-- capa
drop policy if exists "Authenticated can manage capa" on public.capa_actions;
create policy "Authenticated can manage capa"
on public.capa_actions for all to authenticated
using (true) with check (true);

-- audit (penting untuk tab Audit!)
drop policy if exists "Authenticated can view audit logs" on public.audit_logs;
create policy "Authenticated can view audit logs"
on public.audit_logs for select to authenticated
using (true);

drop policy if exists "Authenticated can insert audit logs" on public.audit_logs;
create policy "Authenticated can insert audit logs"
on public.audit_logs for insert to authenticated
with check (true);

drop policy if exists "Public can insert submit audit" on public.audit_logs;
create policy "Public can insert submit audit"
on public.audit_logs for insert to anon
with check (action = 'Laporan dikirim');

-- kpi
drop policy if exists "Authenticated can read kpi" on public.kpi_targets;
create policy "Authenticated can read kpi"
on public.kpi_targets for select to authenticated
using (true);

drop policy if exists "Authenticated can update kpi" on public.kpi_targets;
create policy "Authenticated can update kpi"
on public.kpi_targets for all to authenticated
using (true) with check (true);

-- notification queue
drop policy if exists "Authenticated can read notifications" on public.notification_queue;
create policy "Authenticated can read notifications"
on public.notification_queue for select to authenticated
using (true);

-- notification recipients
drop policy if exists "Authenticated can read notification recipients" on public.notification_recipients;
create policy "Authenticated can read notification recipients"
on public.notification_recipients for select to authenticated
using (true);

drop policy if exists "Authenticated can manage notification recipients" on public.notification_recipients;
create policy "Authenticated can manage notification recipients"
on public.notification_recipients for all to authenticated
using (true) with check (true);

-- storage foto
drop policy if exists "Public can upload evidence photos" on storage.objects;
create policy "Public can upload evidence photos"
on storage.objects for insert to anon, authenticated
with check (bucket_id = 'evidence-photos');

drop policy if exists "Public can read evidence photos" on storage.objects;
create policy "Public can read evidence photos"
on storage.objects for select to public
using (bucket_id = 'evidence-photos');

-- ─── 9. Role user (set manual di Supabase Auth) ──────────────────────────────
-- Authentication → Users → User Metadata:
--   { "role": "admin" }  |  "hse"  |  "pic"  |  "viewer"
-- PIC: { "role": "pic", "pic_department": "HSE" }

-- Selesai ✓
