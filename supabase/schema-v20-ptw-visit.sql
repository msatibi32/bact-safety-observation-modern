-- Keputusan rapat 5 Oktober 2026: satu izin kerja, dan kunjungan setelah penjelasan singkat.
-- Jalankan di SQL Editor. Aman diulang. Tidak menghapus izin yang sudah ada.

alter table public.work_permits drop constraint if exists work_permits_permit_kind_check;
alter table public.work_permits add constraint work_permits_permit_kind_check
  check (permit_kind in ('job_permit', 'e_permit', 'work_permit'));

alter table public.work_permits add column if not exists duration_choice text;
alter table public.work_permits add column if not exists hsse_duration_choice text;
alter table public.work_permits add column if not exists hsse_duration_reason text;
alter table public.work_permits add column if not exists area_authority_email text;

alter table public.work_permits drop constraint if exists work_permits_duration_choice_check;
alter table public.work_permits add constraint work_permits_duration_choice_check
  check (duration_choice is null or duration_choice in ('12h', '7d'));

alter table public.work_permits drop constraint if exists work_permits_hsse_duration_choice_check;
alter table public.work_permits add constraint work_permits_hsse_duration_choice_check
  check (hsse_duration_choice is null or hsse_duration_choice in ('12h', '7d'));

alter table public.visit_requests add column if not exists placement text;
alter table public.visit_requests add column if not exists job_title text;
alter table public.visit_requests add column if not exists brings_goods boolean not null default false;
alter table public.visit_requests add column if not exists briefing_passed boolean not null default false;

create or replace function public.ptw_ref_no()
returns text
language plpgsql
as $$
declare
  v_month int := extract(month from (now() at time zone 'Asia/Jakarta'))::int;
  v_roman text := (array['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'])[v_month];
  v_year int := extract(year from (now() at time zone 'Asia/Jakarta'))::int;
begin
  return 'PTW-' || lpad(nextval('public.work_permit_ref_seq')::text, 4, '0')
    || '-BACT-HSSE-' || v_roman || '-' || v_year::text;
end;
$$;

create or replace function public.list_area_authorities()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'email', u.email,
    'name', coalesce(
      nullif(u.raw_user_meta_data->>'full_name', ''),
      nullif(u.raw_user_meta_data->>'name', ''),
      split_part(u.email, '@', 1)
    )
  ) order by u.email), '[]'::jsonb)
  from auth.users u
  where coalesce(u.raw_app_meta_data->>'role', u.raw_user_meta_data->>'role') = 'spv'
    and u.email is not null
    and (u.banned_until is null or u.banned_until < now());
$$;

revoke all on function public.list_area_authorities() from public;
grant execute on function public.list_area_authorities() to authenticated;

create or replace function public.submit_work_permit(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user auth.users%rowtype;
  v_role text;
  v_name text := nullif(btrim(p->>'applicant_name'), '');
  v_company text := nullif(btrim(p->>'company'), '');
  v_area text := nullif(btrim(p->>'area'), '');
  v_desc text := nullif(btrim(p->>'description'), '');
  v_email text;
  v_authority text := lower(btrim(coalesce(p->>'area_authority_email', '')));
  v_types text[];
  v_details jsonb := coalesce(p->'details', '{}'::jsonb);
  v_row public.work_permits%rowtype;
  v_queue uuid;
begin
  if auth.uid() is null then
    raise exception 'Mengajukan izin kerja wajib login';
  end if;
  select * into v_user from auth.users where id = auth.uid();
  v_role := coalesce(v_user.raw_app_meta_data->>'role', v_user.raw_user_meta_data->>'role', '');
  v_email := lower(v_user.email);
  if v_user.banned_until is not null and v_user.banned_until > now() then
    raise exception 'Akun ini dinonaktifkan';
  end if;
  if coalesce(v_user.raw_app_meta_data->>'ptw_can_apply', '') <> 'true'
     and v_role not in ('admin', 'super_admin') then
    raise exception 'Akun ini belum diizinkan mengajukan izin kerja. Super Admin mengaktifkan setelah pelatihan.';
  end if;
  if coalesce((p->>'electronic_ack')::boolean, false) is not true then
    raise exception 'Kalimat persetujuan elektronik wajib dicentang';
  end if;
  if v_authority = '' or not exists (
    select 1 from auth.users u
    where lower(u.email) = v_authority
      and coalesce(u.raw_app_meta_data->>'role', u.raw_user_meta_data->>'role') = 'spv'
      and (u.banned_until is null or u.banned_until < now())
  ) then
    raise exception 'Pilih area authority dari daftar yang sudah punya akun';
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
  if jsonb_typeof(v_details) is distinct from 'object' then
    raise exception 'Lembar permit tidak valid';
  end if;
  if octet_length(v_details::text) > 160000 then
    raise exception 'Isian permit terlalu panjang';
  end if;

  select coalesce(array_agg(distinct t), '{}')
  into v_types
  from jsonb_array_elements_text(coalesce(p->'work_types', '[]'::jsonb)) as t
  where t in ('Hot Work', 'Cold Work', 'Confine Space', 'Isolation Energy');

  if v_types is null or cardinality(v_types) = 0 then
    raise exception 'Pilih minimal satu jenis pekerjaan';
  end if;

  v_details := v_details || jsonb_build_object(
    'electronic_disclaimer', 'Formulir ini elektronik dan tidak memerlukan tanda tangan fisik.',
    'area_authority_email', v_authority
  );

  insert into public.work_permits (
    ref_no, public_token, permit_kind, applicant_name, applicant_email, company, phone, department,
    area, work_types, description, start_at, persons, safety_induction, details, area_authority_email
  ) values (
    public.ptw_ref_no(),
    replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
    'work_permit',
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
    true,
    v_details,
    v_authority
  )
  returning * into v_row;

  v_queue := public.enqueue_pass_mail(
    v_row.applicant_email, 'ptw', v_row.ref_no, v_row.applicant_name, 'Izin kerja',
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

drop function if exists public.approve_work_permit_spv(uuid);

create or replace function public.approve_work_permit_spv(p_id uuid, p_duration text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  w public.work_permits%rowtype;
  v_actor text := coalesce(auth.jwt() ->> 'email', '');
  v_role text := public.app_role();
  v_queue uuid;
begin
  if v_role not in ('spv', 'admin', 'super_admin') then
    raise exception 'Hanya area authority yang dapat menyetujui langkah ini';
  end if;
  if p_duration not in ('12h', '7d') then
    raise exception 'Pilih durasi 12 jam atau 7 hari';
  end if;
  select * into w from public.work_permits where id = p_id for update;
  if not found then
    raise exception 'Permit tidak ditemukan';
  end if;
  if w.status = 'SpvApproved' then
    return jsonb_build_object('ref_no', w.ref_no, 'status', w.status);
  end if;
  if w.status <> 'Pending' then
    raise exception 'Permit ini tidak menunggu area authority';
  end if;
  if v_role = 'spv' and w.area_authority_email is not null and lower(w.area_authority_email) <> lower(v_actor) then
    raise exception 'Izin ini menunggu area authority yang dipilih pemohon';
  end if;
  update public.work_permits
  set status = 'SpvApproved',
      spv_approved_at = now(),
      spv_approved_by = v_actor,
      duration_choice = p_duration,
      details = jsonb_set(
        coalesce(details, '{}'::jsonb),
        '{approvals}',
        coalesce(details->'approvals', '{}'::jsonb) || jsonb_build_object(
          'area_authority', v_actor,
          'area_date', to_char(now() at time zone 'Asia/Jakarta', 'FMDD Mon YYYY'),
          'area_time', to_char(now() at time zone 'Asia/Jakarta', 'HH24:MI'),
          'duration_choice', p_duration,
          'electronic_disclaimer', 'Formulir ini elektronik dan tidak memerlukan tanda tangan fisik.'
        ),
        true
      )
  where id = p_id
  returning * into w;
  select id into v_queue
  from public.notification_queue
  where type = 'ptw_review'
    and payload->>'ref_no' = w.ref_no
    and payload->>'step' = 'hsse'
  order by created_at desc
  limit 1;
  return jsonb_build_object('ref_no', w.ref_no, 'status', w.status, 'queue_id', v_queue, 'duration_choice', w.duration_choice);
end;
$$;

drop function if exists public.approve_work_permit(uuid);

create or replace function public.approve_work_permit(p_id uuid, p_duration text, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  w public.work_permits%rowtype;
  v_until timestamptz;
  v_queue uuid;
  v_actor text := coalesce(auth.jwt() ->> 'email', 'HSSE');
  v_choice text := p_duration;
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  if public.app_role() not in ('hse', 'admin', 'super_admin') then
    raise exception 'Hanya HSSE yang dapat menyetujui langkah ini';
  end if;
  select * into w from public.work_permits where id = p_id for update;
  if not found then
    raise exception 'Permit tidak ditemukan';
  end if;
  if w.status = 'Approved' then
    return jsonb_build_object('ref_no', w.ref_no, 'status', w.status, 'valid_until', w.valid_until);
  end if;
  if w.status = 'Rejected' then
    raise exception 'Permit ini ditolak';
  end if;
  if w.status <> 'SpvApproved' then
    raise exception 'Area authority harus menyetujui lebih dulu';
  end if;
  if v_choice is null or v_choice = '' then
    v_choice := w.duration_choice;
  end if;
  if v_choice not in ('12h', '7d') then
    raise exception 'Pilih durasi 12 jam atau 7 hari';
  end if;
  if w.duration_choice is not null and v_choice is distinct from w.duration_choice then
    if v_reason is null or char_length(v_reason) < 8 then
      raise exception 'HSSE mengubah durasi. Alasan wajib diisi.';
    end if;
  else
    v_reason := null;
  end if;
  v_until := case when v_choice = '12h' then now() + interval '12 hours' else now() + interval '7 days' end;
  update public.work_permits
  set status = 'Approved',
      approved_at = now(),
      approved_by = v_actor,
      valid_from = now(),
      valid_until = v_until,
      rejected_reason = null,
      hsse_duration_choice = v_choice,
      hsse_duration_reason = v_reason,
      details = jsonb_set(
        coalesce(details, '{}'::jsonb),
        '{approvals}',
        coalesce(details->'approvals', '{}'::jsonb) || jsonb_build_object(
          'hsse_name', v_actor,
          'hsse_date', to_char(now() at time zone 'Asia/Jakarta', 'FMDD Mon YYYY'),
          'hsse_time', to_char(now() at time zone 'Asia/Jakarta', 'HH24:MI'),
          'hsse_duration_choice', v_choice,
          'hsse_duration_reason', coalesce(v_reason, ''),
          'electronic_disclaimer', 'Formulir ini elektronik dan tidak memerlukan tanda tangan fisik.'
        ),
        true
      )
  where id = p_id
  returning * into w;
  v_queue := public.enqueue_pass_mail(
    w.applicant_email, 'ptw', w.ref_no, w.applicant_name, 'Izin kerja',
    w.public_token, 'approved', w.valid_from, w.valid_until
  );
  return jsonb_build_object(
    'ref_no', w.ref_no,
    'status', w.status,
    'valid_until', w.valid_until,
    'queue_id', v_queue,
    'hsse_duration_choice', w.hsse_duration_choice,
    'hsse_duration_reason', w.hsse_duration_reason
  );
end;
$$;

create or replace function public.update_work_permit_sheet(p_id uuid, p jsonb)
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
  v_types text[];
  v_details jsonb := coalesce(p->'details', '{}'::jsonb);
  v_row public.work_permits%rowtype;
begin
  if public.app_role() not in ('spv', 'hse', 'admin', 'super_admin') then
    raise exception 'Hanya SPV atau HSSE yang dapat mengubah lembar permit';
  end if;
  if v_kind not in ('job_permit', 'e_permit', 'work_permit') then
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
  if jsonb_typeof(v_details) is distinct from 'object' then
    raise exception 'Lembar permit tidak valid';
  end if;
  if octet_length(v_details::text) > 160000 then
    raise exception 'Isian permit terlalu panjang';
  end if;

  select coalesce(array_agg(t.val order by t.ord), '{}')
  into v_types
  from jsonb_array_elements_text(coalesce(p->'work_types', '[]'::jsonb)) with ordinality as t(val, ord)
  where t.val in ('Hot Work', 'Cold Work', 'Confine Space', 'Isolation Energy');

  if v_types is null or cardinality(v_types) = 0 then
    raise exception 'Pilih minimal satu jenis pekerjaan';
  end if;

  update public.work_permits
  set permit_kind = v_kind,
      applicant_name = v_name,
      applicant_email = v_email,
      company = v_company,
      phone = nullif(left(btrim(coalesce(p->>'phone', '')), 40), ''),
      department = nullif(left(btrim(coalesce(p->>'department', '')), 80), ''),
      area = v_area,
      work_types = v_types,
      description = v_desc,
      start_at = (p->>'start_at')::timestamptz,
      persons = nullif(left(btrim(coalesce(p->>'persons', '')), 2000), ''),
      details = v_details
  where id = p_id
  returning * into v_row;

  if v_row.id is null then
    raise exception 'Permit tidak ditemukan';
  end if;

  return to_jsonb(v_row);
end;
$$;

create or replace function public.get_public_pass(p_kind text, p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  w public.work_permits%rowtype;
  v public.visit_requests%rowtype;
  v_duration text;
begin
  if p_token is null or char_length(p_token) < 16 then
    return null;
  end if;

  if p_kind = 'ptw' then
    select * into w from public.work_permits where public_token = p_token;
    if not found then
      return null;
    end if;
    v_duration := coalesce(w.hsse_duration_choice, w.duration_choice);
    return jsonb_build_object(
      'kind', 'ptw',
      'ref_no', w.ref_no,
      'name', w.applicant_name,
      'company', w.company,
      'type_label', case when w.permit_kind = 'work_permit' then 'Izin kerja' when w.permit_kind = 'e_permit' then 'E-Permit to Work' else 'Job Permit' end,
      'lifetime_label', case
        when v_duration = '12h' then '12 jam sejak disetujui HSSE'
        when v_duration = '7d' then '7 hari sejak disetujui HSSE'
        when w.permit_kind = 'e_permit' then '12 jam sejak disetujui HSSE'
        else '14 hari sejak disetujui HSSE'
      end,
      'area', w.area,
      'detail', left(w.description, 180),
      'status', w.status,
      'approved_by', w.approved_by,
      'valid_from', w.valid_from,
      'valid_until', w.valid_until,
      'phase', public.pass_phase(w.status, w.valid_from, w.valid_until),
      'route_to', 'HSSE',
      'duration_choice', w.duration_choice,
      'hsse_duration_choice', w.hsse_duration_choice,
      'hsse_duration_reason', w.hsse_duration_reason,
      'sheet', case
        when w.status = 'Approved' then jsonb_build_object(
          'permit_kind', w.permit_kind,
          'phone', w.phone,
          'department', w.department,
          'description', w.description,
          'start_at', w.start_at,
          'work_types', to_jsonb(w.work_types),
          'details', w.details,
          'approved_at', w.approved_at,
          'duration_choice', v_duration,
          'hsse_duration_reason', w.hsse_duration_reason
        )
        else null
      end
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
      'detail', left(v.purpose, 180),
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
  if coalesce((p->>'briefing_passed')::boolean, false) is not true then
    raise exception 'Penjelasan keselamatan dan pertanyaannya wajib diselesaikan lebih dulu';
  end if;
  if coalesce((p->>'declaration_accepted')::boolean, false) is not true then
    raise exception 'Deklarasi safety dan ISPS Code wajib disetujui';
  end if;
  if v_name is null or char_length(v_name) < 3 then
    raise exception 'Nama pengunjung tidak valid';
  end if;
  if v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or char_length(v_email) > 160 then
    raise exception 'Email pengunjung wajib diisi';
  end if;
  if v_company is null then
    raise exception 'Kontraktor atau perusahaan wajib diisi';
  end if;
  if v_purpose is null or char_length(v_purpose) < 8 or char_length(v_purpose) > 2000 then
    raise exception 'Tujuan kunjungan wajib diisi';
  end if;
  if v_start is null or v_end is null or v_end < v_start then
    raise exception 'Tanggal kunjungan tidak valid';
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
    declaration_accepted, safety_induction, placement, job_title, brings_goods, briefing_passed
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
    true,
    nullif(left(btrim(coalesce(p->>'placement', '')), 120), ''),
    nullif(left(btrim(coalesce(p->>'job_title', '')), 120), ''),
    coalesce((p->>'brings_goods')::boolean, false),
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

revoke all on function public.submit_work_permit(jsonb) from public, anon;
grant execute on function public.submit_work_permit(jsonb) to authenticated;
revoke all on function public.approve_work_permit_spv(uuid, text) from public;
grant execute on function public.approve_work_permit_spv(uuid, text) to authenticated;
revoke all on function public.approve_work_permit(uuid, text, text) from public;
grant execute on function public.approve_work_permit(uuid, text, text) to authenticated;
revoke all on function public.submit_visit_request(jsonb) from public;
grant execute on function public.submit_visit_request(jsonb) to anon, authenticated;
