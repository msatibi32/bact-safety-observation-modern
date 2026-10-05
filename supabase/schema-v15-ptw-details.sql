-- =============================================================================
-- v15 — Simpan lembar PTW (bagian 1–8) sebagai jsonb
-- Jalankan sekali. Aman diulang.
-- =============================================================================

alter table public.work_permits add column if not exists applicant_email text;
alter table public.visit_requests add column if not exists applicant_email text;
alter table public.work_permits add column if not exists details jsonb not null default '{}'::jsonb;

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
  if octet_length(v_details::text) > 24000 then
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
