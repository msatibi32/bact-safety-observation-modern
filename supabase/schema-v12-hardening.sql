-- =============================================================================
-- v12: Hardening produksi (OWASP-style) — idempotent, tidak menghapus data
-- Aman diulang. Menyertakan ulang kebijakan v10 + tambahan.
-- =============================================================================

create or replace function public.app_role()
returns text
language sql
stable
as $$
  select lower(coalesce(
    nullif(auth.jwt() -> 'app_metadata' ->> 'role', ''),
    nullif(auth.jwt() -> 'user_metadata' ->> 'role', ''),
    'viewer'
  ));
$$;

create or replace function public.is_hse_staff()
returns boolean
language sql
stable
as $$
  select public.app_role() in ('hse', 'admin', 'super_admin');
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
as $$
  select public.app_role() in ('admin', 'super_admin');
$$;

grant execute on function public.app_role() to anon, authenticated;
grant execute on function public.is_hse_staff() to anon, authenticated;
grant execute on function public.is_super_admin() to anon, authenticated;

update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
  'role', coalesce(
    nullif(raw_app_meta_data->>'role', ''),
    nullif(raw_user_meta_data->>'role', ''),
    'viewer'
  )
);

alter table public.observations enable row level security;
alter table public.capa_actions enable row level security;
alter table public.audit_logs enable row level security;
alter table public.kpi_targets enable row level security;
alter table public.notification_queue enable row level security;
alter table public.notification_recipients enable row level security;

-- ── observations ─────────────────────────────────────────────────────────────

drop policy if exists "Public can submit observations" on public.observations;
drop policy if exists "Public can insert observations" on public.observations;
drop policy if exists "Authenticated can read observations" on public.observations;
drop policy if exists "Authenticated can view observations" on public.observations;
drop policy if exists "Authenticated can update observations" on public.observations;
drop policy if exists "Authenticated can delete observations" on public.observations;
drop policy if exists "Authenticated can delete" on public.observations;
drop policy if exists "HSE can update observations" on public.observations;
drop policy if exists "Super Admin can delete observations" on public.observations;

create policy "Public can submit observations"
on public.observations for insert to anon, authenticated
with check (
  status in ('Open', 'Under Review')
  and assigned_pic is null
  and closed_date is null
);

create policy "Authenticated can read observations"
on public.observations for select to authenticated
using (true);

create policy "HSE can update observations"
on public.observations for update to authenticated
using (public.is_hse_staff())
with check (public.is_hse_staff());

create policy "Super Admin can delete observations"
on public.observations for delete to authenticated
using (public.is_super_admin());

-- ── CAPA ─────────────────────────────────────────────────────────────────────

drop policy if exists "Authenticated can manage capa" on public.capa_actions;
drop policy if exists "Authenticated can read capa" on public.capa_actions;
drop policy if exists "HSE can write capa" on public.capa_actions;
drop policy if exists "HSE can update capa" on public.capa_actions;
drop policy if exists "HSE can delete capa" on public.capa_actions;

create policy "Authenticated can read capa"
on public.capa_actions for select to authenticated
using (true);
create policy "HSE can write capa"
on public.capa_actions for insert to authenticated
with check (public.is_hse_staff());
create policy "HSE can update capa"
on public.capa_actions for update to authenticated
using (public.is_hse_staff())
with check (public.is_hse_staff());
create policy "HSE can delete capa"
on public.capa_actions for delete to authenticated
using (public.is_hse_staff());

-- ── audit ────────────────────────────────────────────────────────────────────

drop policy if exists "Authenticated can view audit logs" on public.audit_logs;
drop policy if exists "Authenticated can insert audit logs" on public.audit_logs;
drop policy if exists "Public can insert submit audit" on public.audit_logs;

create policy "Authenticated can view audit logs"
on public.audit_logs for select to authenticated
using (true);

create policy "Authenticated can insert audit logs"
on public.audit_logs for insert to authenticated
with check (public.is_hse_staff());

create policy "Public can insert submit audit"
on public.audit_logs for insert to anon
with check (action = 'Laporan dikirim');

-- ── KPI ──────────────────────────────────────────────────────────────────────

drop policy if exists "Authenticated can read kpi" on public.kpi_targets;
drop policy if exists "Authenticated can update kpi" on public.kpi_targets;
drop policy if exists "Super Admin can write kpi" on public.kpi_targets;
drop policy if exists "Super Admin can insert kpi" on public.kpi_targets;
drop policy if exists "Super Admin can update kpi" on public.kpi_targets;

create policy "Authenticated can read kpi"
on public.kpi_targets for select to authenticated
using (true);

create policy "Super Admin can insert kpi"
on public.kpi_targets for insert to authenticated
with check (public.is_super_admin());

create policy "Super Admin can update kpi"
on public.kpi_targets for update to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

-- ── notification queue: Super Admin select only (service_role bypasses RLS) ──

drop policy if exists "Authenticated can read notifications" on public.notification_queue;
drop policy if exists "HSE can read notifications" on public.notification_queue;
drop policy if exists "Super Admin can read notifications" on public.notification_queue;

create policy "Super Admin can read notifications"
on public.notification_queue for select to authenticated
using (public.is_super_admin());

-- ── notification recipients: Super Admin only (HSE Officer has no menu) ──────

drop policy if exists "Authenticated can read notification recipients" on public.notification_recipients;
drop policy if exists "Authenticated can manage notification recipients" on public.notification_recipients;
drop policy if exists "HSE can read notification recipients" on public.notification_recipients;
drop policy if exists "HSE can write notification recipients" on public.notification_recipients;
drop policy if exists "HSE can insert notification recipients" on public.notification_recipients;
drop policy if exists "HSE can update notification recipients" on public.notification_recipients;
drop policy if exists "HSE can delete notification recipients" on public.notification_recipients;
drop policy if exists "Super Admin can read notification recipients" on public.notification_recipients;
drop policy if exists "Super Admin can insert notification recipients" on public.notification_recipients;
drop policy if exists "Super Admin can update notification recipients" on public.notification_recipients;
drop policy if exists "Super Admin can delete notification recipients" on public.notification_recipients;

create policy "Super Admin can read notification recipients"
on public.notification_recipients for select to authenticated
using (public.is_super_admin());
create policy "Super Admin can insert notification recipients"
on public.notification_recipients for insert to authenticated
with check (public.is_super_admin());
create policy "Super Admin can update notification recipients"
on public.notification_recipients for update to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());
create policy "Super Admin can delete notification recipients"
on public.notification_recipients for delete to authenticated
using (public.is_super_admin());

-- ── activity logs ────────────────────────────────────────────────────────────

do $$
begin
  if to_regclass('public.activity_logs') is null then
    return;
  end if;
  execute 'alter table public.activity_logs enable row level security';
  execute 'drop policy if exists "activity_logs_select_auth" on public.activity_logs';
  execute 'drop policy if exists "activity_logs_insert_auth" on public.activity_logs';
  execute 'drop policy if exists "Super Admin can read activity logs" on public.activity_logs';
  execute 'drop policy if exists "Staff can insert activity logs" on public.activity_logs';
  execute 'create policy "Super Admin can read activity logs" on public.activity_logs for select to authenticated using (public.is_super_admin())';
  execute 'create policy "Staff can insert activity logs" on public.activity_logs for insert to authenticated with check (public.is_hse_staff())';
end $$;

-- ── storage evidence-photos ──────────────────────────────────────────────────

drop policy if exists "Public can upload evidence photos" on storage.objects;
create policy "Public can upload evidence photos"
on storage.objects for insert to anon, authenticated
with check (
  bucket_id = 'evidence-photos'
  and position('..' in name) = 0
  and lower(coalesce(storage.extension(name), '')) in ('jpg', 'jpeg', 'png', 'webp', 'heic', 'heif')
);

drop policy if exists "Public can read evidence photos" on storage.objects;
drop policy if exists "Authenticated can read evidence photos" on storage.objects;
create policy "Authenticated can read evidence photos"
on storage.objects for select to authenticated
using (bucket_id = 'evidence-photos');

drop policy if exists "Super Admin can delete evidence photos" on storage.objects;
create policy "Super Admin can delete evidence photos"
on storage.objects for delete to authenticated
using (bucket_id = 'evidence-photos' and public.is_super_admin());

update storage.buckets
set
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
where id = 'evidence-photos';

-- ── sanitasi insert anon (Excel import = authenticated, tidak diubah) ────────

create or replace function public.sanitize_public_observation_insert()
returns trigger
language plpgsql
as $$
begin
  if auth.role() is distinct from 'anon' then
    return new;
  end if;

  new.assigned_pic := null;
  new.closed_date := null;
  new.triage_notes := null;
  new.investigation_notes := null;
  new.investigation_data := null;
  new.root_cause := null;
  new.finding_observation := null;
  new.verification_notes := null;
  new.verified_at := null;
  new.verified_by := null;
  new.closing_notes := null;
  new.soc_number := null;
  new.pdf_to := null;
  new.pdf_pic := null;
  new.pdf_subject := null;
  new.pdf_action_checks := null;
  new.investigator_name := null;
  new.escalation_due_at := null;

  new.is_anonymous := false;
  new.escalated := false;

  if coalesce(new.stop_work, false) then
    new.is_hipo := true;
    new.status := 'Under Review';
    new.requires_investigation := true;
  else
    new.is_hipo := false;
    new.status := 'Open';
    new.requires_investigation := false;
  end if;

  new.reporter_name := left(coalesce(new.reporter_name, ''), 120);
  new.reporter_position := left(coalesce(new.reporter_position, ''), 80);
  new.company_name := left(new.company_name, 120);
  new.location_text := left(coalesce(new.location_text, ''), 200);
  new.description := left(coalesce(new.description, ''), 4000);

  if new.photo_urls is not null and cardinality(new.photo_urls) > 8 then
    new.photo_urls := new.photo_urls[1:8];
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sanitize_public_observation_insert on public.observations;
drop trigger if exists trg_observation_anon_sanitize on public.observations;
create trigger trg_observation_anon_sanitize
before insert on public.observations
for each row execute function public.sanitize_public_observation_insert();

-- ── rate limit anon: max 8 / menit (authenticated skip untuk Excel import) ───

create or replace function public.enforce_observation_insert_rate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  if auth.role() = 'authenticated' then
    return new;
  end if;
  select count(*) into n
  from public.observations
  where created_at > now() - interval '1 minute'
    and coalesce(triage_notes, '') not ilike 'Imported from HSE Excel%';
  if n >= 8 then
    raise exception 'Terlalu banyak laporan dalam waktu singkat. Coba lagi sebentar.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_observation_insert_rate on public.observations;
create trigger trg_observation_insert_rate
before insert on public.observations
for each row execute function public.enforce_observation_insert_rate();

-- ── defense in depth GRANTs ──────────────────────────────────────────────────

revoke select, update, delete, truncate on table public.observations from anon;
revoke select, update, delete, truncate on table public.capa_actions from anon;
revoke select, update, delete, truncate on table public.kpi_targets from anon;
revoke select, update, delete, truncate on table public.notification_queue from anon;
revoke select, update, delete, truncate on table public.notification_recipients from anon;

grant insert on table public.observations to anon;
grant insert on table public.audit_logs to anon;

-- ── optional length CHECKs (hanya jika data existing muat) ───────────────────

do $$
declare
  max_name int;
  max_pos int;
  max_company int;
  max_loc int;
  max_desc int;
begin
  select
    coalesce(max(char_length(reporter_name)), 0),
    coalesce(max(char_length(reporter_position)), 0),
    coalesce(max(char_length(company_name)), 0),
    coalesce(max(char_length(location_text)), 0),
    coalesce(max(char_length(description)), 0)
  into max_name, max_pos, max_company, max_loc, max_desc
  from public.observations;

  if max_name <= 120 then
    alter table public.observations drop constraint if exists observations_reporter_name_len;
    alter table public.observations add constraint observations_reporter_name_len
      check (char_length(reporter_name) <= 120);
  end if;
  if max_pos <= 80 then
    alter table public.observations drop constraint if exists observations_reporter_position_len;
    alter table public.observations add constraint observations_reporter_position_len
      check (char_length(reporter_position) <= 80);
  end if;
  if max_company <= 120 then
    alter table public.observations drop constraint if exists observations_company_name_len;
    alter table public.observations add constraint observations_company_name_len
      check (company_name is null or char_length(company_name) <= 120);
  end if;
  if max_loc <= 200 then
    alter table public.observations drop constraint if exists observations_location_text_len;
    alter table public.observations add constraint observations_location_text_len
      check (char_length(location_text) <= 200);
  end if;
  if max_desc <= 4000 then
    alter table public.observations drop constraint if exists observations_description_len;
    alter table public.observations add constraint observations_description_len
      check (char_length(description) <= 4000);
  end if;
end $$;
