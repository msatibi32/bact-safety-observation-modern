-- =============================================================================
-- v13 — Follow-up SOC tanpa login, Permit to Work, Port Visit
-- Jalankan sekali di Supabase → SQL Editor. Aman diulang.
-- =============================================================================

alter table public.observations add column if not exists followup_token text;
alter table public.observations add column if not exists followup_email text;
alter table public.observations add column if not exists followup_deadline date;
alter table public.observations add column if not exists followup_action_plan text;
alter table public.observations add column if not exists followup_status text;
alter table public.observations add column if not exists followup_overdue_reason text;
alter table public.observations add column if not exists followup_evidence_urls text[] not null default '{}';

alter table public.observations drop constraint if exists observations_followup_status_check;
alter table public.observations add constraint observations_followup_status_check
  check (followup_status is null or followup_status in ('On Progress', 'Closed'));

create unique index if not exists observations_followup_token_idx
  on public.observations (followup_token)
  where followup_token is not null;

-- ── Kontak email departemen follow-up ────────────────────────────────────────

create table if not exists public.department_contacts (
  department text primary key,
  email text not null,
  updated_at timestamptz not null default now()
);

alter table public.department_contacts enable row level security;

drop policy if exists "HSE can read department contacts" on public.department_contacts;
drop policy if exists "HSE can insert department contacts" on public.department_contacts;
drop policy if exists "HSE can update department contacts" on public.department_contacts;

create policy "HSE can read department contacts"
on public.department_contacts for select to authenticated
using (public.is_hse_staff());

create policy "HSE can insert department contacts"
on public.department_contacts for insert to authenticated
with check (public.is_hse_staff());

create policy "HSE can update department contacts"
on public.department_contacts for update to authenticated
using (public.is_hse_staff())
with check (public.is_hse_staff());

revoke all on table public.department_contacts from anon;
grant select, insert, update on table public.department_contacts to authenticated;

-- ── Permit to Work ───────────────────────────────────────────────────────────

create sequence if not exists public.work_permit_ref_seq;

create table if not exists public.work_permits (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ref_no text not null unique,
  public_token text not null unique,
  permit_kind text not null check (permit_kind in ('job_permit', 'e_permit')),
  applicant_name text not null,
  company text not null,
  phone text,
  department text,
  area text not null,
  work_types text[] not null default '{}',
  description text not null,
  start_at timestamptz,
  persons text,
  safety_induction boolean not null default false,
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected')),
  approved_at timestamptz,
  approved_by text,
  rejected_reason text,
  valid_from timestamptz,
  valid_until timestamptz
);

create index if not exists work_permits_created_idx on public.work_permits (created_at desc);
create index if not exists work_permits_status_idx on public.work_permits (status);

drop trigger if exists trg_work_permits_updated_at on public.work_permits;
create trigger trg_work_permits_updated_at
before update on public.work_permits
for each row execute function public.set_updated_at();

alter table public.work_permits enable row level security;

drop policy if exists "HSE can read work permits" on public.work_permits;
drop policy if exists "HSE can update work permits" on public.work_permits;
create policy "HSE can read work permits"
on public.work_permits for select to authenticated
using (public.is_hse_staff() or public.app_role() = 'viewer');
create policy "HSE can update work permits"
on public.work_permits for update to authenticated
using (public.is_hse_staff())
with check (public.is_hse_staff());

revoke all on table public.work_permits from anon;
grant select on table public.work_permits to authenticated;

-- ── Port Visit ───────────────────────────────────────────────────────────────

create sequence if not exists public.visit_request_ref_seq;

create table if not exists public.visit_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ref_no text not null unique,
  public_token text not null unique,
  visitor_name text not null,
  company text not null,
  phone text,
  purpose text not null,
  visit_start date not null,
  visit_end date not null,
  ktp_url text,
  passport_url text,
  declaration_accepted boolean not null default false,
  safety_induction boolean not null default false,
  route_to text not null default 'Corporate Communication HSSE',
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected')),
  approved_at timestamptz,
  approved_by text,
  rejected_reason text,
  valid_from timestamptz,
  valid_until timestamptz
);

create index if not exists visit_requests_created_idx on public.visit_requests (created_at desc);
create index if not exists visit_requests_status_idx on public.visit_requests (status);

drop trigger if exists trg_visit_requests_updated_at on public.visit_requests;
create trigger trg_visit_requests_updated_at
before update on public.visit_requests
for each row execute function public.set_updated_at();

alter table public.visit_requests enable row level security;

drop policy if exists "HSE can read visit requests" on public.visit_requests;
drop policy if exists "HSE can update visit requests" on public.visit_requests;
create policy "HSE can read visit requests"
on public.visit_requests for select to authenticated
using (public.is_hse_staff() or public.app_role() = 'viewer');
create policy "HSE can update visit requests"
on public.visit_requests for update to authenticated
using (public.is_hse_staff())
with check (public.is_hse_staff());

revoke all on table public.visit_requests from anon;
grant select on table public.visit_requests to authenticated;

-- ── Helpers ──────────────────────────────────────────────────────────────────

create or replace function public.pass_phase(
  p_status text,
  p_from timestamptz,
  p_until timestamptz
)
returns text
language sql
stable
as $$
  select case
    when p_status = 'Rejected' then 'rejected'
    when p_status is distinct from 'Approved' then 'pending'
    when p_until is not null and now() > p_until then 'expired'
    when p_from is not null and now() < p_from then 'scheduled'
    else 'valid'
  end;
$$;

-- ── Ajukan PTW (tanpa login) ─────────────────────────────────────────────────

create or replace function public.submit_work_permit(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := nullif(btrim(p->>'applicant_name'), '');
  v_company text := nullif(btrim(p->>'company'), '');
  v_area text := nullif(btrim(p->>'area'), '');
  v_desc text := nullif(btrim(p->>'description'), '');
  v_kind text := p->>'permit_kind';
  v_types text[];
  v_row public.work_permits%rowtype;
begin
  if coalesce((p->>'safety_induction')::boolean, false) is not true then
    raise exception 'Safety induction wajib diisi';
  end if;
  if v_kind not in ('job_permit', 'e_permit') then
    raise exception 'Jenis permit tidak dikenal';
  end if;
  if v_name is null or char_length(v_name) < 3 or char_length(v_name) > 120 then
    raise exception 'Nama pemohon tidak valid';
  end if;
  if v_company is null or char_length(v_company) > 120 then
    raise exception 'Perusahaan wajib diisi';
  end if;
  if v_area is null or char_length(v_area) > 200 then
    raise exception 'Area kerja wajib diisi';
  end if;
  if v_desc is null or char_length(v_desc) < 10 or char_length(v_desc) > 4000 then
    raise exception 'Deskripsi pekerjaan minimal 10 karakter';
  end if;
  if p->>'start_at' is null or p->>'start_at' = '' then
    raise exception 'Jadwal mulai pekerjaan wajib diisi';
  end if;

  select coalesce(array_agg(distinct t), '{}')
  into v_types
  from jsonb_array_elements_text(coalesce(p->'work_types', '[]'::jsonb)) as t
  where t in ('Hot Work', 'Cold Work', 'Confine Space', 'Isolation Energy');

  if v_types is null or cardinality(v_types) = 0 then
    raise exception 'Pilih minimal satu jenis pekerjaan';
  end if;

  insert into public.work_permits (
    ref_no, public_token, permit_kind, applicant_name, company, phone, department,
    area, work_types, description, start_at, persons, safety_induction
  ) values (
    'PTW-' || to_char(now() at time zone 'Asia/Jakarta', 'YYYY') || '-' || lpad(nextval('public.work_permit_ref_seq')::text, 4, '0'),
    replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
    v_kind,
    v_name,
    v_company,
    nullif(btrim(p->>'phone'), ''),
    nullif(btrim(p->>'department'), ''),
    v_area,
    v_types,
    v_desc,
    (p->>'start_at')::timestamptz,
    nullif(left(btrim(coalesce(p->>'persons', '')), 2000), ''),
    true
  )
  returning * into v_row;

  return jsonb_build_object(
    'id', v_row.id,
    'ref_no', v_row.ref_no,
    'public_token', v_row.public_token,
    'status', v_row.status
  );
end;
$$;

-- ── Ajukan Visit (tanpa login) ───────────────────────────────────────────────

create or replace function public.submit_visit_request(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := nullif(btrim(p->>'visitor_name'), '');
  v_company text := nullif(btrim(p->>'company'), '');
  v_purpose text := nullif(btrim(p->>'purpose'), '');
  v_start date := nullif(p->>'visit_start', '')::date;
  v_end date := nullif(p->>'visit_end', '')::date;
  v_ktp text := nullif(btrim(p->>'ktp_url'), '');
  v_pass text := nullif(btrim(p->>'passport_url'), '');
  v_row public.visit_requests%rowtype;
begin
  if coalesce((p->>'declaration_accepted')::boolean, false) is not true then
    raise exception 'Deklarasi safety dan ISPS Code wajib disetujui';
  end if;
  if coalesce((p->>'safety_induction')::boolean, false) is not true then
    raise exception 'Safety briefing / induction wajib diisi';
  end if;
  if v_name is null or char_length(v_name) < 3 then
    raise exception 'Nama pengunjung tidak valid';
  end if;
  if v_company is null then
    raise exception 'Perusahaan wajib diisi';
  end if;
  if v_purpose is null or char_length(v_purpose) < 8 or char_length(v_purpose) > 2000 then
    raise exception 'Tujuan kunjungan wajib diisi';
  end if;
  if v_start is null or v_end is null or v_end < v_start then
    raise exception 'Tanggal kunjungan tidak valid';
  end if;
  if v_ktp is null and v_pass is null then
    raise exception 'Unggah foto KTP atau paspor';
  end if;
  if v_ktp is not null and v_ktp !~ '^https://' then
    raise exception 'Berkas KTP tidak valid';
  end if;
  if v_pass is not null and v_pass !~ '^https://' then
    raise exception 'Berkas paspor tidak valid';
  end if;

  insert into public.visit_requests (
    ref_no, public_token, visitor_name, company, phone, purpose,
    visit_start, visit_end, ktp_url, passport_url,
    declaration_accepted, safety_induction
  ) values (
    'VIS-' || to_char(now() at time zone 'Asia/Jakarta', 'YYYY') || '-' || lpad(nextval('public.visit_request_ref_seq')::text, 4, '0'),
    replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
    left(v_name, 120),
    left(v_company, 120),
    nullif(left(btrim(coalesce(p->>'phone', '')), 40), ''),
    v_purpose,
    v_start,
    v_end,
    v_ktp,
    v_pass,
    true,
    true
  )
  returning * into v_row;

  return jsonb_build_object(
    'id', v_row.id,
    'ref_no', v_row.ref_no,
    'public_token', v_row.public_token,
    'status', v_row.status
  );
end;
$$;

-- ── Halaman barcode (scan) ───────────────────────────────────────────────────

create or replace function public.get_public_pass(p_kind text, p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  w public.work_permits%rowtype;
  v public.visit_requests%rowtype;
begin
  if p_token is null or char_length(p_token) < 16 then
    return null;
  end if;

  if p_kind = 'ptw' then
    select * into w from public.work_permits where public_token = p_token;
    if not found then
      return null;
    end if;
    return jsonb_build_object(
      'kind', 'ptw',
      'ref_no', w.ref_no,
      'name', w.applicant_name,
      'company', w.company,
      'type_label', case when w.permit_kind = 'e_permit' then 'E-Permit to Work' else 'Job Permit' end,
      'lifetime_label', case when w.permit_kind = 'e_permit' then '12 jam sejak disetujui HSSE' else '14 hari sejak disetujui HSSE' end,
      'area', w.area,
      'detail', w.description,
      'status', w.status,
      'approved_by', w.approved_by,
      'valid_from', w.valid_from,
      'valid_until', w.valid_until,
      'phase', public.pass_phase(w.status, w.valid_from, w.valid_until),
      'route_to', 'HSSE'
    );
  end if;

  if p_kind = 'visit' then
    select * into v from public.visit_requests where public_token = p_token;
    if not found then
      return null;
    end if;
    return jsonb_build_object(
      'kind', 'visit',
      'ref_no', v.ref_no,
      'name', v.visitor_name,
      'company', v.company,
      'type_label', 'Port Visit',
      'lifetime_label', 'Berlaku pada tanggal kunjungan yang disetujui',
      'area', to_char(v.visit_start, 'DD Mon YYYY') || ' – ' || to_char(v.visit_end, 'DD Mon YYYY'),
      'detail', v.purpose,
      'status', v.status,
      'approved_by', v.approved_by,
      'valid_from', v.valid_from,
      'valid_until', v.valid_until,
      'phase', public.pass_phase(v.status, v.valid_from, v.valid_until),
      'route_to', v.route_to
    );
  end if;

  return null;
end;
$$;

-- ── Form follow-up departemen ────────────────────────────────────────────────

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
    'reporter', o.reporter_name,
    'company', o.company_name,
    'department', o.assigned_pic,
    'location', o.location_text,
    'description', o.description,
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

create or replace function public.submit_followup(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text := nullif(p->>'token', '');
  v_plan text := nullif(btrim(p->>'action_plan'), '');
  v_status text := p->>'followup_status';
  v_reason text := nullif(btrim(p->>'overdue_reason'), '');
  v_deadline date := nullif(p->>'deadline', '')::date;
  v_today date := (now() at time zone 'Asia/Jakarta')::date;
  v_urls text[] := '{}';
  o public.observations%rowtype;
  v_obs_status text;
begin
  if v_token is null then
    raise exception 'Tautan tidak valid';
  end if;
  select * into o from public.observations where followup_token = v_token for update;
  if not found then
    raise exception 'Tautan follow-up tidak ditemukan';
  end if;
  if o.status = 'Closed' or o.followup_status = 'Closed' then
    raise exception 'Laporan ini sudah ditutup';
  end if;
  if v_status not in ('On Progress', 'Closed') then
    raise exception 'Status harus On Progress atau Closed';
  end if;
  if v_deadline is null then
    raise exception 'Tanggal deadline wajib diisi';
  end if;
  if v_plan is null or char_length(v_plan) < 10 then
    raise exception 'Action plan wajib diisi';
  end if;

  select coalesce(array_agg(u), '{}')
  into v_urls
  from jsonb_array_elements_text(coalesce(p->'evidence', '[]'::jsonb)) as u
  where u ~ '^https://' and u !~ '[<>"[:space:]]';

  if v_deadline < v_today and v_reason is null then
    raise exception 'Lewat deadline. Isi alasannya.';
  end if;
  if v_status = 'Closed' and cardinality(v_urls) < 1 then
    raise exception 'Lampirkan foto bukti sebelum menutup laporan';
  end if;

  v_obs_status := case when v_status = 'Closed' then 'Closed' else 'In Progress' end;

  update public.observations
  set
    followup_deadline = v_deadline,
    followup_action_plan = left(v_plan, 4000),
    followup_status = v_status,
    followup_overdue_reason = v_reason,
    followup_evidence_urls = v_urls,
    status = v_obs_status,
    closing_notes = case when v_status = 'Closed' then left(v_plan, 4000) else closing_notes end,
    closed_date = case when v_status = 'Closed' then v_today else closed_date end
  where id = o.id
  returning * into o;

  insert into public.audit_logs (observation_id, action, details, actor_email)
  values (
    o.id,
    case when v_status = 'Closed' then 'Follow-up ditutup departemen' else 'Follow-up diperbarui' end,
    concat_ws(' · ', o.assigned_pic, v_status, 'deadline ' || v_deadline::text),
    coalesce(o.followup_email, 'Departemen')
  );

  return jsonb_build_object('status', o.status, 'followup_status', o.followup_status, 'closed', o.status = 'Closed');
end;
$$;

-- ── Antrian email follow-up (dipanggil HSSE) ─────────────────────────────────

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
      'subject_override', '[BACT SOC] Tindak lanjut ' || coalesce(o.assigned_pic, 'departemen') || ' — ' || coalesce(o.soc_number, left(o.id::text, 8)),
      'department', o.assigned_pic,
      'soc_number', coalesce(o.soc_number, left(o.id::text, 8)),
      'risk_level', o.risk_level,
      'location', o.location_text,
      'category', o.category,
      'link', v_link
    )
  )
  returning id into v_queue;
  return v_queue;
end;
$$;

-- ── Setujui / tolak ──────────────────────────────────────────────────────────

create or replace function public.approve_work_permit(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  w public.work_permits%rowtype;
  v_until timestamptz;
  v_actor text := coalesce(auth.jwt() ->> 'email', 'HSSE');
begin
  if not public.is_hse_staff() then
    raise exception 'Only HSSE can approve a permit';
  end if;
  select * into w from public.work_permits where id = p_id for update;
  if not found then
    raise exception 'Permit not found';
  end if;
  if w.status = 'Approved' then
    return jsonb_build_object('ref_no', w.ref_no, 'status', w.status, 'valid_until', w.valid_until);
  end if;
  if w.status = 'Rejected' then
    raise exception 'This permit was rejected';
  end if;
  v_until := case when w.permit_kind = 'e_permit' then now() + interval '12 hours' else now() + interval '14 days' end;
  update public.work_permits
  set status = 'Approved',
      approved_at = now(),
      approved_by = v_actor,
      valid_from = now(),
      valid_until = v_until,
      rejected_reason = null
  where id = p_id
  returning * into w;
  return jsonb_build_object('ref_no', w.ref_no, 'status', w.status, 'valid_until', w.valid_until);
end;
$$;

create or replace function public.reject_work_permit(p_id uuid, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  w public.work_permits%rowtype;
begin
  if not public.is_hse_staff() then
    raise exception 'Only HSSE can reject a permit';
  end if;
  if nullif(btrim(coalesce(p_reason, '')), '') is null then
    raise exception 'A rejection reason is required';
  end if;
  update public.work_permits
  set status = 'Rejected',
      rejected_reason = left(btrim(p_reason), 500),
      approved_by = coalesce(auth.jwt() ->> 'email', 'HSSE')
  where id = p_id and status <> 'Approved'
  returning * into w;
  if not found then
    raise exception 'Permit cannot be rejected';
  end if;
  return jsonb_build_object('ref_no', w.ref_no, 'status', w.status);
end;
$$;

create or replace function public.approve_visit_request(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v public.visit_requests%rowtype;
  v_actor text := coalesce(auth.jwt() ->> 'email', 'HSSE');
begin
  if not public.is_hse_staff() then
    raise exception 'Only HSSE can approve a visit';
  end if;
  select * into v from public.visit_requests where id = p_id for update;
  if not found then
    raise exception 'Visit request not found';
  end if;
  if v.status = 'Approved' then
    return jsonb_build_object('ref_no', v.ref_no, 'status', v.status, 'valid_until', v.valid_until);
  end if;
  if v.status = 'Rejected' then
    raise exception 'This visit was rejected';
  end if;
  update public.visit_requests
  set status = 'Approved',
      approved_at = now(),
      approved_by = v_actor,
      valid_from = (v.visit_start::timestamp) at time zone 'Asia/Jakarta',
      valid_until = ((v.visit_end::timestamp + interval '1 day') - interval '1 second') at time zone 'Asia/Jakarta',
      rejected_reason = null
  where id = p_id
  returning * into v;
  return jsonb_build_object('ref_no', v.ref_no, 'status', v.status, 'valid_until', v.valid_until);
end;
$$;

create or replace function public.reject_visit_request(p_id uuid, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v public.visit_requests%rowtype;
begin
  if not public.is_hse_staff() then
    raise exception 'Only HSSE can reject a visit';
  end if;
  if nullif(btrim(coalesce(p_reason, '')), '') is null then
    raise exception 'A rejection reason is required';
  end if;
  update public.visit_requests
  set status = 'Rejected',
      rejected_reason = left(btrim(p_reason), 500),
      approved_by = coalesce(auth.jwt() ->> 'email', 'HSSE')
  where id = p_id and status <> 'Approved'
  returning * into v;
  if not found then
    raise exception 'Visit request cannot be rejected';
  end if;
  return jsonb_build_object('ref_no', v.ref_no, 'status', v.status);
end;
$$;

revoke all on function public.submit_work_permit(jsonb) from public;
revoke all on function public.submit_visit_request(jsonb) from public;
revoke all on function public.get_public_pass(text, text) from public;
revoke all on function public.get_followup_form(text) from public;
revoke all on function public.submit_followup(jsonb) from public;
revoke all on function public.queue_followup_email(uuid, text) from public;
revoke all on function public.approve_work_permit(uuid) from public;
revoke all on function public.reject_work_permit(uuid, text) from public;
revoke all on function public.approve_visit_request(uuid) from public;
revoke all on function public.reject_visit_request(uuid, text) from public;
revoke all on function public.pass_phase(text, timestamptz, timestamptz) from public;

grant execute on function public.submit_work_permit(jsonb) to anon, authenticated;
grant execute on function public.submit_visit_request(jsonb) to anon, authenticated;
grant execute on function public.get_public_pass(text, text) to anon, authenticated;
grant execute on function public.get_followup_form(text) to anon, authenticated;
grant execute on function public.submit_followup(jsonb) to anon, authenticated;
grant execute on function public.queue_followup_email(uuid, text) to authenticated;
grant execute on function public.approve_work_permit(uuid) to authenticated;
grant execute on function public.reject_work_permit(uuid, text) to authenticated;
grant execute on function public.approve_visit_request(uuid) to authenticated;
grant execute on function public.reject_visit_request(uuid, text) to authenticated;
grant execute on function public.pass_phase(text, timestamptz, timestamptz) to anon, authenticated;
