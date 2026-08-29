-- v3b — notifikasi semua laporan baru (email + WA + dashboard)
-- Jalankan di Supabase SQL Editor setelah schema-v3.sql

create or replace function public.on_observation_insert_v3()
returns trigger language plpgsql security definer as $$
begin
  insert into public.notification_queue (type, payload) values (
    case when new.is_hipo then 'hipo_alert' else 'new_report' end,
    jsonb_build_object(
      'observation_id', new.id,
      'category', new.category,
      'risk_level', new.risk_level,
      'location', coalesce(new.location_text, '—'),
      'reporter', case when new.is_anonymous then 'Anonim' else new.reporter_name end,
      'is_hipo', coalesce(new.is_hipo, false),
      'company', coalesce(new.company_name, '—'),
      'channels', jsonb_build_array('email', 'whatsapp', 'dashboard')
    )
  );

  if new.is_hipo then
    new.escalation_due_at := coalesce(new.escalation_due_at, new.created_at + interval '24 hours');
  end if;

  return new;
end;
$$;

-- Opsional: pg_cron panggil Edge Function setiap menit (butuh extension pg_cron di Supabase Pro)
-- select cron.schedule('process-soc-notifications', '* * * * *',
--   $$ select net.http_post(
--     url := 'https://<project>.supabase.co/functions/v1/process-notifications',
--     headers := '{"Authorization": "Bearer <service_role>"}'::jsonb
--   ) $$
-- );
