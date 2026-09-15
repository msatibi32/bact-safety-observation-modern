-- v11: email only after a live form row exists. Skip historical Excel import.
-- Jalankan di Supabase SQL Editor (aman diulang). Tidak menghapus observations.

create or replace function public.on_observation_insert_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.triage_notes, '') ilike 'Imported from HSE Excel%' then
    return new;
  end if;

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

  if new.is_hipo and new.escalation_due_at is null then
    update public.observations
      set escalation_due_at = coalesce(new.created_at, now()) + interval '24 hours'
      where id = new.id
        and escalation_due_at is null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_observation_v3_insert on public.observations;
drop trigger if exists trg_observation_notify on public.observations;
create trigger trg_observation_notify
after insert on public.observations
for each row execute function public.on_observation_insert_notify();

-- Sisa antrian import (bukan form live) jangan dikirim saat tes dummy.
update public.notification_queue q
set
  status = 'sent',
  sent_at = coalesce(q.sent_at, now()),
  error_message = 'Skipped: not a live form submit (import or missing observation)'
where q.status = 'pending'
  and (
    not exists (
      select 1 from public.observations o
      where o.id::text = q.payload->>'observation_id'
    )
    or exists (
      select 1 from public.observations o
      where o.id::text = q.payload->>'observation_id'
        and coalesce(o.triage_notes, '') ilike 'Imported from HSE Excel%'
    )
  );
