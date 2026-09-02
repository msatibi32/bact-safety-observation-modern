-- Risiko boleh belum diisi pelapor; admin/HSE yang mengklasifikasi.
alter table public.observations drop constraint if exists observations_risk_level_check;
alter table public.observations add constraint observations_risk_level_check
  check (risk_level in ('Unclassified', 'Low', 'Medium', 'High'));
