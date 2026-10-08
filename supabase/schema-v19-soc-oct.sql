-- SATU FILE untuk SQL Editor. Aman diulang.
-- 1) Kartu SOC: jenis "Saran", nama pelapor disembunyikan di follow-up, email CAPA bawa saran.
-- 2) Menu dashboard baru: employee, man power, insiden, audit, HIRADC, legal, dan modul lain.

alter table public.observations drop constraint if exists observations_category_check;
alter table public.observations add constraint observations_category_check
  check (category in (
    'Unsafe Act',
    'Unsafe Condition',
    'Near Miss',
    'Positive Observation',
    'Suggestion',
    'Belum diklasifikasi',
    'Observasi'
  ));

create or replace function public.get_followup_form(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  o public.observations%rowtype;
begin
  if p_token is null or char_length(p_token) < 16 then
    return null;
  end if;
  select * into o from public.observations where followup_token = p_token;
  if not found then
    return null;
  end if;
  return jsonb_build_object(
    'soc_number', coalesce(o.soc_number, left(o.id::text, 8)),
    'reporter', 'Disembunyikan',
    'company', o.company_name,
    'department', o.assigned_pic,
    'location', o.location_text,
    'description', o.description,
    'suggestion', coalesce(o.immediate_action, ''),
    'category', o.category,
    'risk_level', o.risk_level,
    'incident_at', o.incident_datetime,
    'status', o.status,
    'deadline', o.followup_deadline,
    'action_plan', coalesce(o.followup_action_plan, ''),
    'followup_status', coalesce(o.followup_status, ''),
    'overdue_reason', coalesce(o.followup_overdue_reason, ''),
    'evidence', to_jsonb(coalesce(o.followup_evidence_urls, '{}')),
    'closed', o.status = 'Closed' or o.followup_status = 'Closed'
  );
end;
$$;

create or replace function public.queue_followup_email(p_id uuid, p_app_url text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  o public.observations%rowtype;
  v_url text := rtrim(coalesce(p_app_url, ''), '/');
  v_link text;
  v_queue uuid;
begin
  if not public.is_hse_staff() then
    raise exception 'Hanya HSSE yang dapat mengirim tautan follow-up';
  end if;
  if v_url !~ '^https?://' or v_url ~ '[[:space:]]' then
    raise exception 'Alamat aplikasi tidak valid';
  end if;
  select * into o from public.observations where id = p_id;
  if not found then
    raise exception 'Laporan tidak ditemukan';
  end if;
  if o.followup_token is null or o.followup_email is null then
    raise exception 'Email departemen dan tautan follow-up belum siap';
  end if;
  v_link := v_url || '/follow-up/' || o.followup_token;
  insert into public.notification_queue (type, payload)
  values (
    'followup_assign',
    jsonb_build_object(
      'observation_id', o.id,
      'only_to', lower(o.followup_email),
      'subject_override', '[BACT SOC] Permintaan CAPA ' || coalesce(o.assigned_pic, 'departemen') || ' — ' || coalesce(o.soc_number, left(o.id::text, 8)),
      'department', o.assigned_pic,
      'soc_number', coalesce(o.soc_number, left(o.id::text, 8)),
      'risk_level', o.risk_level,
      'location', o.location_text,
      'category', o.category,
      'description', o.description,
      'suggestion', coalesce(o.immediate_action, ''),
      'link', v_link
    )
  )
  returning id into v_queue;
  return v_queue;
end;
$$;

-- ── Menu dashboard (Employee, Man Power, Insiden, Audit, HIRADC, Legal, dll.) ──

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.hse_module_records (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  module text not null,
  title text not null default '',
  status text not null default '',
  data jsonb not null default '{}'::jsonb
);

create index if not exists hse_module_records_module_idx
  on public.hse_module_records (module, created_at desc);

create table if not exists public.hse_incidents (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  category text,
  severity text,
  description text,
  lokasi text,
  status text not null default 'Open',
  occurred_at timestamptz,
  pic text,
  root_cause text,
  corrective_action text
);

create index if not exists hse_incidents_occurred_idx
  on public.hse_incidents (occurred_at desc);

drop trigger if exists trg_hse_module_records_updated_at on public.hse_module_records;
create trigger trg_hse_module_records_updated_at
before update on public.hse_module_records
for each row execute function public.set_updated_at();

drop trigger if exists trg_hse_incidents_updated_at on public.hse_incidents;
create trigger trg_hse_incidents_updated_at
before update on public.hse_incidents
for each row execute function public.set_updated_at();

alter table public.hse_module_records enable row level security;
alter table public.hse_incidents enable row level security;

drop policy if exists "Staff can read hse modules" on public.hse_module_records;
create policy "Staff can read hse modules"
  on public.hse_module_records for select to authenticated
  using (true);

drop policy if exists "HSE can insert hse modules" on public.hse_module_records;
create policy "HSE can insert hse modules"
  on public.hse_module_records for insert to authenticated
  with check (public.is_hse_staff());

drop policy if exists "HSE can update hse modules" on public.hse_module_records;
create policy "HSE can update hse modules"
  on public.hse_module_records for update to authenticated
  using (public.is_hse_staff())
  with check (public.is_hse_staff());

drop policy if exists "HSE can delete hse modules" on public.hse_module_records;
create policy "HSE can delete hse modules"
  on public.hse_module_records for delete to authenticated
  using (public.is_hse_staff());

drop policy if exists "Staff can read hse incidents" on public.hse_incidents;
create policy "Staff can read hse incidents"
  on public.hse_incidents for select to authenticated
  using (true);

drop policy if exists "HSE can insert hse incidents" on public.hse_incidents;
create policy "HSE can insert hse incidents"
  on public.hse_incidents for insert to authenticated
  with check (public.is_hse_staff());

drop policy if exists "HSE can update hse incidents" on public.hse_incidents;
create policy "HSE can update hse incidents"
  on public.hse_incidents for update to authenticated
  using (public.is_hse_staff())
  with check (public.is_hse_staff());

drop policy if exists "HSE can delete hse incidents" on public.hse_incidents;
create policy "HSE can delete hse incidents"
  on public.hse_incidents for delete to authenticated
  using (public.is_hse_staff());

grant select, insert, update, delete on public.hse_module_records to authenticated;
grant select, insert, update, delete on public.hse_incidents to authenticated;
