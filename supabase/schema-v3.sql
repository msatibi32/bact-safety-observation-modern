-- Safety Observation Card v3 — roles, anonymous, KPI, notifications, escalation
-- Jalankan di Supabase SQL Editor setelah schema-v2.sql

-- ─── 1. Kolom tambahan observations ─────────────────────────────────────────

alter table public.observations add column if not exists is_anonymous boolean not null default false;
alter table public.observations add column if not exists escalated boolean not null default false;
alter table public.observations add column if not exists escalation_due_at timestamptz;

create index if not exists observations_escalation_idx on public.observations (escalation_due_at)
  where escalated = false and status not in ('Closed', 'Rejected');

-- ─── 2. KPI targets ───────────────────────────────────────────────────────────

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

alter table public.kpi_targets enable row level security;
drop policy if exists "Authenticated can read kpi" on public.kpi_targets;
create policy "Authenticated can read kpi" on public.kpi_targets for select to authenticated using (true);
drop policy if exists "Authenticated can update kpi" on public.kpi_targets;
create policy "Authenticated can update kpi" on public.kpi_targets for all to authenticated using (true) with check (true);

-- ─── 3. Notification queue (untuk email/WA via Edge Function) ─────────────────

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

alter table public.notification_queue enable row level security;
drop policy if exists "Authenticated can read notifications" on public.notification_queue;
create policy "Authenticated can read notifications" on public.notification_queue for select to authenticated using (true);

-- ─── 4. Trigger: HiPo → queue notifikasi + set escalation deadline ───────────

create or replace function public.on_observation_insert_v3()
returns trigger language plpgsql security definer as $$
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
create trigger trg_observation_v3_insert
before insert on public.observations
for each row execute function public.on_observation_insert_v3();

-- ─── 5. Role user via Supabase Auth metadata ──────────────────────────────────
-- Set role di Dashboard → Authentication → Users → user metadata:
--   { "role": "admin" }  |  "hse"  |  "pic"  |  "viewer"
-- PIC juga bisa set: { "role": "pic", "pic_department": "HSE" }
