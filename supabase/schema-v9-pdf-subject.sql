-- v9: Perihal PDF + checklist tindakan Notice
-- Jalankan di Supabase SQL Editor (opsional — app punya fallback).

alter table public.observations
  add column if not exists pdf_subject text,
  add column if not exists pdf_action_checks jsonb;

comment on column public.observations.pdf_subject is 'Perihal/Subject manual untuk PDF Notice (bukan nama pelapor)';
comment on column public.observations.pdf_action_checks is 'Array boolean: tindakan PDF yang dicentang HSE';
