-- =============================================================================
-- v10: Hardening keamanan (OWASP-style) — tidak menghapus data
-- Jalankan di Supabase Dashboard → SQL Editor setelah backup.
--
-- Isi:
--  - Role dari JWT (app_metadata, fallback user_metadata)
--  - Publik hanya INSERT laporan baru (Open / Under Review)
--  - UPDATE laporan + CAPA + penerima email: HSE / Super Admin
--  - DELETE laporan dummy: Super Admin
--  - Viewer tidak bisa ubah data lewat API
--  - Storage foto: insert hanya ekstensi gambar
--  - Rate limit insert anon: max 20 laporan / menit (import Excel tetap lewat)
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

-- Salin role ke app_metadata (tidak bisa diubah user biasa)
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
  'role', coalesce(
    nullif(raw_app_meta_data->>'role', ''),
    nullif(raw_user_meta_data->>'role', ''),
    'viewer'
  )
);

-- ── observations ─────────────────────────────────────────────────────────────

drop policy if exists "Public can submit observations" on public.observations;
create policy "Public can submit observations"
on public.observations for insert to anon, authenticated
with check (
  status in ('Open', 'Under Review')
  and assigned_pic is null
  and closed_date is null
);

drop policy if exists "Authenticated can read observations" on public.observations;
create policy "Authenticated can read observations"
on public.observations for select to authenticated
using (true);

drop policy if exists "Authenticated can update observations" on public.observations;
drop policy if exists "HSE can update observations" on public.observations;
create policy "HSE can update observations"
on public.observations for update to authenticated
using (public.is_hse_staff())
with check (public.is_hse_staff());

drop policy if exists "Super Admin can delete observations" on public.observations;
create policy "Super Admin can delete observations"
on public.observations for delete to authenticated
using (public.is_super_admin());

-- ── CAPA ─────────────────────────────────────────────────────────────────────

drop policy if exists "Authenticated can manage capa" on public.capa_actions;
drop policy if exists "Authenticated can read capa" on public.capa_actions;
drop policy if exists "HSE can write capa" on public.capa_actions;
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
create policy "Authenticated can view audit logs"
on public.audit_logs for select to authenticated
using (true);

drop policy if exists "Authenticated can insert audit logs" on public.audit_logs;
create policy "Authenticated can insert audit logs"
on public.audit_logs for insert to authenticated
with check (true);

drop policy if exists "Public can insert submit audit" on public.audit_logs;
create policy "Public can insert submit audit"
on public.audit_logs for insert to anon
with check (action = 'Laporan dikirim');

-- ── KPI ──────────────────────────────────────────────────────────────────────

drop policy if exists "Authenticated can read kpi" on public.kpi_targets;
create policy "Authenticated can read kpi"
on public.kpi_targets for select to authenticated
using (true);

drop policy if exists "Authenticated can update kpi" on public.kpi_targets;
drop policy if exists "Super Admin can write kpi" on public.kpi_targets;
create policy "Super Admin can write kpi"
on public.kpi_targets for update to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

-- ── notification queue / recipients ──────────────────────────────────────────

drop policy if exists "Authenticated can read notifications" on public.notification_queue;
drop policy if exists "HSE can read notifications" on public.notification_queue;
create policy "HSE can read notifications"
on public.notification_queue for select to authenticated
using (public.is_hse_staff());

drop policy if exists "Authenticated can read notification recipients" on public.notification_recipients;
drop policy if exists "Authenticated can manage notification recipients" on public.notification_recipients;
drop policy if exists "HSE can read notification recipients" on public.notification_recipients;
drop policy if exists "HSE can write notification recipients" on public.notification_recipients;
create policy "HSE can read notification recipients"
on public.notification_recipients for select to authenticated
using (public.is_hse_staff());
create policy "HSE can insert notification recipients"
on public.notification_recipients for insert to authenticated
with check (public.is_hse_staff());
create policy "HSE can update notification recipients"
on public.notification_recipients for update to authenticated
using (public.is_hse_staff())
with check (public.is_hse_staff());
create policy "HSE can delete notification recipients"
on public.notification_recipients for delete to authenticated
using (public.is_hse_staff());

-- ── activity logs (hanya jika tabel v8 sudah ada) ────────────────────────────

do $$
begin
  if to_regclass('public.activity_logs') is null then
    return;
  end if;
  execute 'drop policy if exists "activity_logs_select_auth" on public.activity_logs';
  execute 'drop policy if exists "activity_logs_insert_auth" on public.activity_logs';
  execute 'drop policy if exists "Super Admin can read activity logs" on public.activity_logs';
  execute 'drop policy if exists "Staff can insert activity logs" on public.activity_logs';
  execute 'create policy "Super Admin can read activity logs" on public.activity_logs for select to authenticated using (public.is_super_admin())';
  execute 'create policy "Staff can insert activity logs" on public.activity_logs for insert to authenticated with check (public.is_hse_staff())';
end $$;

-- ── storage foto ─────────────────────────────────────────────────────────────

drop policy if exists "Public can upload evidence photos" on storage.objects;
create policy "Public can upload evidence photos"
on storage.objects for insert to anon, authenticated
with check (
  bucket_id = 'evidence-photos'
  and lower(coalesce(storage.extension(name), '')) in ('jpg', 'jpeg', 'png', 'webp', 'heic', 'heif')
);

drop policy if exists "Public can read evidence photos" on storage.objects;
create policy "Public can read evidence photos"
on storage.objects for select to public
using (bucket_id = 'evidence-photos');

-- ── rate limit insert anon ───────────────────────────────────────────────────

create or replace function public.enforce_observation_insert_rate()
returns trigger
language plpgsql
as $$
declare
  n int;
begin
  if auth.role() = 'authenticated' then
    return new;
  end if;
  select count(*) into n
  from public.observations
  where created_at > now() - interval '1 minute';
  if n >= 20 then
    raise exception 'Terlalu banyak laporan dalam waktu singkat. Coba lagi sebentar.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_observation_insert_rate on public.observations;
create trigger trg_observation_insert_rate
before insert on public.observations
for each row execute function public.enforce_observation_insert_rate();
