-- =============================================================================
-- v18 — SPV menyetujui lebih dulu, HSSE sesudahnya.
--       Keduanya menempelkan foto tanda tangan yang sudah disimpan.
-- Jalankan sekali. Aman diulang.
-- =============================================================================

alter table public.work_permits add column if not exists spv_approved_at timestamptz;
alter table public.work_permits add column if not exists spv_approved_by text;

do $$
declare
  r record;
begin
  for r in
    select conname
    from pg_constraint
    where conrelid = 'public.work_permits'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%Pending%'
  loop
    execute format('alter table public.work_permits drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.work_permits
  add constraint work_permits_status_check
  check (status in ('Pending', 'SpvApproved', 'Approved', 'Rejected'));

create table if not exists public.staff_signatures (
  user_id uuid primary key,
  email text,
  image text not null,
  updated_at timestamptz not null default now()
);

alter table public.staff_signatures enable row level security;
revoke all on table public.staff_signatures from public, anon, authenticated;

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
    when p_status = 'SpvApproved' then 'awaiting_hsse'
    when p_status is distinct from 'Approved' then 'pending'
    when p_until is not null and now() > p_until then 'expired'
    when p_from is not null and now() < p_from then 'scheduled'
    else 'valid'
  end;
$$;

create or replace function public.save_staff_signature(p_image text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_image text := btrim(coalesce(p_image, ''));
begin
  if auth.uid() is null then
    raise exception 'Login dulu';
  end if;
  if public.app_role() not in ('spv', 'hse', 'admin', 'super_admin') then
    raise exception 'Hanya SPV atau HSSE yang menyimpan tanda tangan';
  end if;
  if v_image !~ '^data:image/(png|jpeg);base64,[A-Za-z0-9+/=]+$' or char_length(v_image) > 80000 then
    raise exception 'Foto tanda tangan tidak valid atau terlalu besar';
  end if;
  insert into public.staff_signatures (user_id, email, image, updated_at)
  values (auth.uid(), auth.jwt() ->> 'email', v_image, now())
  on conflict (user_id) do update
  set email = excluded.email, image = excluded.image, updated_at = now();
end;
$$;

create or replace function public.get_staff_signature()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_image text;
begin
  if auth.uid() is null then
    return jsonb_build_object('image', '');
  end if;
  select image into v_image from public.staff_signatures where user_id = auth.uid();
  return jsonb_build_object('image', coalesce(v_image, ''));
end;
$$;

create or replace function public.enqueue_ptw_review(
  p_email text,
  p_ref text,
  p_name text,
  p_area text,
  p_step text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_queue uuid;
  v_email text := lower(btrim(coalesce(p_email, '')));
begin
  if v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    return null;
  end if;
  insert into public.notification_queue (type, payload)
  values (
    'ptw_review',
    jsonb_build_object(
      'only_to', v_email,
      'subject_override', case
        when p_step = 'hsse' then '[BACT] ' || p_ref || ' menunggu HSSE'
        else '[BACT] ' || p_ref || ' menunggu SPV'
      end,
      'ref_no', p_ref,
      'name', p_name,
      'area', p_area,
      'step', p_step,
      'link', 'https://bact-safety-observation-modern.vercel.app/admin/ptw'
    )
  )
  returning id into v_queue;
  return v_queue;
end;
$$;

create or replace function public.notify_ptw_reviewers()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  if tg_op = 'INSERT' and new.status = 'Pending' then
    for v_email in
      select u.email
      from auth.users u
      where coalesce(u.raw_app_meta_data->>'role', u.raw_user_meta_data->>'role') in ('spv', 'hse', 'admin', 'super_admin')
        and u.email is not null
    loop
      perform public.enqueue_ptw_review(v_email, new.ref_no, new.applicant_name, new.area, 'spv');
    end loop;
  elsif tg_op = 'UPDATE' and old.status is distinct from 'SpvApproved' and new.status = 'SpvApproved' then
    for v_email in
      select u.email
      from auth.users u
      where coalesce(u.raw_app_meta_data->>'role', u.raw_user_meta_data->>'role') in ('hse', 'admin', 'super_admin')
        and u.email is not null
    loop
      perform public.enqueue_ptw_review(v_email, new.ref_no, new.applicant_name, new.area, 'hsse');
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists work_permits_review_mail on public.work_permits;
create trigger work_permits_review_mail
after insert or update of status on public.work_permits
for each row execute function public.notify_ptw_reviewers();

create or replace function public.approve_work_permit_spv(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  w public.work_permits%rowtype;
  v_actor text := coalesce(auth.jwt() ->> 'email', 'SPV');
  v_sign text;
  v_queue uuid;
begin
  if public.app_role() not in ('spv', 'admin', 'super_admin') then
    raise exception 'Hanya SPV yang dapat menyetujui langkah ini';
  end if;
  select image into v_sign from public.staff_signatures where user_id = auth.uid();
  if v_sign is null then
    raise exception 'Unggah foto tanda tangan dulu, di bagian atas halaman permit';
  end if;
  select * into w from public.work_permits where id = p_id for update;
  if not found then
    raise exception 'Permit tidak ditemukan';
  end if;
  if w.status = 'SpvApproved' then
    return jsonb_build_object('ref_no', w.ref_no, 'status', w.status);
  end if;
  if w.status <> 'Pending' then
    raise exception 'Permit ini tidak menunggu SPV';
  end if;
  update public.work_permits
  set status = 'SpvApproved',
      spv_approved_at = now(),
      spv_approved_by = v_actor,
      details = jsonb_set(
        coalesce(details, '{}'::jsonb),
        '{approvals}',
        coalesce(details->'approvals', '{}'::jsonb) || jsonb_build_object(
          'area_authority', v_actor,
          'area_date', to_char(now() at time zone 'Asia/Jakarta', 'FMDD Mon YYYY'),
          'area_time', to_char(now() at time zone 'Asia/Jakarta', 'HH24:MI'),
          'area_sign', v_sign
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
  return jsonb_build_object('ref_no', w.ref_no, 'status', w.status, 'queue_id', v_queue);
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
  v_sign text;
begin
  if public.app_role() not in ('hse', 'admin', 'super_admin') then
    raise exception 'Hanya HSSE yang dapat menyetujui langkah ini';
  end if;
  select image into v_sign from public.staff_signatures where user_id = auth.uid();
  if v_sign is null then
    raise exception 'Unggah foto tanda tangan dulu, di bagian atas halaman permit';
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
    raise exception 'SPV harus menyetujui lebih dulu';
  end if;
  v_until := case when w.permit_kind = 'e_permit' then now() + interval '12 hours' else now() + interval '14 days' end;
  update public.work_permits
  set status = 'Approved',
      approved_at = now(),
      approved_by = v_actor,
      valid_from = now(),
      valid_until = v_until,
      rejected_reason = null,
      details = jsonb_set(
        coalesce(details, '{}'::jsonb),
        '{approvals}',
        coalesce(details->'approvals', '{}'::jsonb) || jsonb_build_object(
          'hsse_name', v_actor,
          'hsse_date', to_char(now() at time zone 'Asia/Jakarta', 'FMDD Mon YYYY'),
          'hsse_time', to_char(now() at time zone 'Asia/Jakarta', 'HH24:MI'),
          'hsse_sign', v_sign
        ),
        true
      )
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

create or replace function public.reject_work_permit(p_id uuid, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  w public.work_permits%rowtype;
begin
  if public.app_role() not in ('spv', 'hse', 'admin', 'super_admin') then
    raise exception 'Hanya SPV atau HSSE yang dapat menolak permit';
  end if;
  if nullif(btrim(coalesce(p_reason, '')), '') is null then
    raise exception 'Alasan penolakan wajib diisi';
  end if;
  update public.work_permits
  set status = 'Rejected',
      rejected_reason = left(btrim(p_reason), 500),
      approved_by = coalesce(auth.jwt() ->> 'email', 'HSSE')
  where id = p_id and status <> 'Approved'
  returning * into w;
  if not found then
    raise exception 'Permit tidak bisa ditolak';
  end if;
  return jsonb_build_object('ref_no', w.ref_no, 'status', w.status);
end;
$$;

drop policy if exists "Authenticated can read observations" on public.observations;
create policy "Authenticated can read observations"
on public.observations for select to authenticated
using (public.app_role() is distinct from 'spv');

drop policy if exists "HSE can read work permits" on public.work_permits;
create policy "HSE can read work permits"
on public.work_permits for select to authenticated
using (public.is_hse_staff() or public.app_role() in ('viewer', 'spv'));

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

revoke all on function public.update_work_permit_sheet(uuid, jsonb) from public;
grant execute on function public.update_work_permit_sheet(uuid, jsonb) to authenticated;

revoke all on function public.save_staff_signature(text) from public;
revoke all on function public.get_staff_signature() from public;
revoke all on function public.enqueue_ptw_review(text, text, text, text, text) from public;
revoke all on function public.approve_work_permit_spv(uuid) from public;
grant execute on function public.save_staff_signature(text) to authenticated;
grant execute on function public.get_staff_signature() to authenticated;
grant execute on function public.approve_work_permit_spv(uuid) to authenticated;
