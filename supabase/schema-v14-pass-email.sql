-- =============================================================================
-- v14 — Email barcode saat submit, email persetujuan + masa aktif saat approve
-- Jalankan sekali. Aman diulang.
-- =============================================================================

alter table public.work_permits add column if not exists applicant_email text;
alter table public.visit_requests add column if not exists applicant_email text;

create or replace function public.enqueue_pass_mail(
  p_email text,
  p_kind text,
  p_ref text,
  p_name text,
  p_label text,
  p_token text,
  p_event text,
  p_valid_from timestamptz,
  p_valid_until timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_queue uuid;
  v_link text;
  v_subject text;
  v_email text := lower(btrim(coalesce(p_email, '')));
begin
  if v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    return null;
  end if;
  v_link := 'https://bact-safety-observation-modern.vercel.app/pass/' || p_kind || '/' || p_token;
  if p_event = 'approved' then
    v_subject := '[BACT] ' || p_ref || ' disetujui';
  else
    v_subject := '[BACT] Barcode ' || p_ref;
  end if;
  insert into public.notification_queue (type, payload)
  values (
    case when p_event = 'approved' then 'pass_approved' else 'pass_barcode' end,
    jsonb_build_object(
      'only_to', v_email,
      'subject_override', v_subject,
      'ref_no', p_ref,
      'kind', p_kind,
      'kind_label', p_label,
      'name', p_name,
      'link', v_link,
      'token', p_token,
      'valid_from', p_valid_from,
      'valid_until', p_valid_until
    )
  )
  returning id into v_queue;
  return v_queue;
end;
$$;

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
  v_email text := lower(btrim(coalesce(p->>'email', '')));
  v_label text;
  v_types text[];
  v_row public.work_permits%rowtype;
  v_queue uuid;
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
  if v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or char_length(v_email) > 160 then
    raise exception 'Email pemohon wajib diisi';
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

  v_label := case when v_kind = 'e_permit' then 'E-Permit to Work' else 'Job Permit' end;

  insert into public.work_permits (
    ref_no, public_token, permit_kind, applicant_name, applicant_email, company, phone, department,
    area, work_types, description, start_at, persons, safety_induction
  ) values (
    'PTW-' || to_char(now() at time zone 'Asia/Jakarta', 'YYYY') || '-' || lpad(nextval('public.work_permit_ref_seq')::text, 4, '0'),
    replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
    v_kind,
    v_name,
    v_email,
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

  v_queue := public.enqueue_pass_mail(
    v_row.applicant_email, 'ptw', v_row.ref_no, v_row.applicant_name, v_label,
    v_row.public_token, 'barcode', null, null
  );

  return jsonb_build_object(
    'id', v_row.id,
    'ref_no', v_row.ref_no,
    'public_token', v_row.public_token,
    'status', v_row.status,
    'queue_id', v_queue
  );
end;
$$;

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
  v_email text := lower(btrim(coalesce(p->>'email', '')));
  v_start date := nullif(p->>'visit_start', '')::date;
  v_end date := nullif(p->>'visit_end', '')::date;
  v_ktp text := nullif(btrim(p->>'ktp_url'), '');
  v_pass text := nullif(btrim(p->>'passport_url'), '');
  v_row public.visit_requests%rowtype;
  v_queue uuid;
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
  if v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or char_length(v_email) > 160 then
    raise exception 'Email pengunjung wajib diisi';
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
    ref_no, public_token, visitor_name, applicant_email, company, phone, purpose,
    visit_start, visit_end, ktp_url, passport_url,
    declaration_accepted, safety_induction
  ) values (
    'VIS-' || to_char(now() at time zone 'Asia/Jakarta', 'YYYY') || '-' || lpad(nextval('public.visit_request_ref_seq')::text, 4, '0'),
    replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
    left(v_name, 120),
    v_email,
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

  v_queue := public.enqueue_pass_mail(
    v_row.applicant_email, 'visit', v_row.ref_no, v_row.visitor_name, 'Port Visit',
    v_row.public_token, 'barcode', null, null
  );

  return jsonb_build_object(
    'id', v_row.id,
    'ref_no', v_row.ref_no,
    'public_token', v_row.public_token,
    'status', v_row.status,
    'queue_id', v_queue
  );
end;
$$;

create or replace function public.approve_work_permit(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  w public.work_permits%rowtype;
  v_until timestamptz;
  v_queue uuid;
  v_label text;
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
  v_label := case when w.permit_kind = 'e_permit' then 'E-Permit to Work' else 'Job Permit' end;
  v_queue := public.enqueue_pass_mail(
    w.applicant_email, 'ptw', w.ref_no, w.applicant_name, v_label,
    w.public_token, 'approved', w.valid_from, w.valid_until
  );
  return jsonb_build_object(
    'ref_no', w.ref_no,
    'status', w.status,
    'valid_until', w.valid_until,
    'queue_id', v_queue
  );
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
  v_queue uuid;
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
  v_queue := public.enqueue_pass_mail(
    v.applicant_email, 'visit', v.ref_no, v.visitor_name, 'Port Visit',
    v.public_token, 'approved', v.valid_from, v.valid_until
  );
  return jsonb_build_object(
    'ref_no', v.ref_no,
    'status', v.status,
    'valid_until', v.valid_until,
    'queue_id', v_queue
  );
end;
$$;

create or replace function public.resend_pass_email(p_kind text, p_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  w public.work_permits%rowtype;
  v public.visit_requests%rowtype;
  v_label text;
begin
  if not public.is_hse_staff() then
    raise exception 'Only HSSE can resend this email';
  end if;
  if p_kind = 'ptw' then
    select * into w from public.work_permits where id = p_id;
    if not found then
      raise exception 'Permit not found';
    end if;
    if w.status <> 'Approved' then
      raise exception 'Permit is not approved yet';
    end if;
    v_label := case when w.permit_kind = 'e_permit' then 'E-Permit to Work' else 'Job Permit' end;
    return public.enqueue_pass_mail(
      w.applicant_email, 'ptw', w.ref_no, w.applicant_name, v_label,
      w.public_token, 'approved', w.valid_from, w.valid_until
    );
  end if;
  if p_kind = 'visit' then
    select * into v from public.visit_requests where id = p_id;
    if not found then
      raise exception 'Visit request not found';
    end if;
    if v.status <> 'Approved' then
      raise exception 'Visit is not approved yet';
    end if;
    return public.enqueue_pass_mail(
      v.applicant_email, 'visit', v.ref_no, v.visitor_name, 'Port Visit',
      v.public_token, 'approved', v.valid_from, v.valid_until
    );
  end if;
  raise exception 'Unknown pass kind';
end;
$$;

revoke all on function public.enqueue_pass_mail(text, text, text, text, text, text, text, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.resend_pass_email(text, uuid) from public;
grant execute on function public.resend_pass_email(text, uuid) to authenticated;
