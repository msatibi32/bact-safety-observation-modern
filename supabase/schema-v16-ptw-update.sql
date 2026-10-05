-- =============================================================================
-- v16 — HSSE boleh mengoreksi isian lembar PTW tanpa mengubah status atau barcode
-- Jalankan sekali. Aman diulang.
-- =============================================================================

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
  if octet_length(v_details::text) > 24000 then
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

revoke all on function public.update_work_permit_sheet(uuid, jsonb) from public;
grant execute on function public.update_work_permit_sheet(uuid, jsonb) to authenticated;
