-- =============================================================================
-- v17 — Halaman barcode menampilkan lembar PTW yang sudah disetujui,
--       dan isian (termasuk gambar tanda tangan) boleh lebih panjang.
-- Jalankan sekali. Aman diulang.
-- =============================================================================

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
      'detail', left(w.description, 180),
      'status', w.status,
      'approved_by', w.approved_by,
      'valid_from', w.valid_from,
      'valid_until', w.valid_until,
      'phase', public.pass_phase(w.status, w.valid_from, w.valid_until),
      'route_to', 'HSSE',
      'sheet', case
        when w.status = 'Approved' then jsonb_build_object(
          'permit_kind', w.permit_kind,
          'phone', w.phone,
          'department', w.department,
          'description', w.description,
          'start_at', w.start_at,
          'work_types', to_jsonb(w.work_types),
          'details', w.details,
          'approved_at', w.approved_at
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
  v_details jsonb := coalesce(p->'details', '{}'::jsonb);
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
  if jsonb_typeof(v_details) is distinct from 'object' then
    raise exception 'Lembar permit tidak valid';
  end if;
  if octet_length(v_details::text) > 96000 then
    raise exception 'Isian permit terlalu panjang';
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
    area, work_types, description, start_at, persons, safety_induction, details
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
    true,
    v_details
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
  if not public.is_hse_staff() then
    raise exception 'Hanya HSSE yang dapat mengubah lembar permit';
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
  if jsonb_typeof(v_details) is distinct from 'object' then
    raise exception 'Lembar permit tidak valid';
  end if;
  if octet_length(v_details::text) > 96000 then
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
