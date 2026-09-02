-- ID karyawan BACT pada laporan (opsional, hanya terisi jika pelapor pilih dari daftar).
alter table public.observations add column if not exists reporter_employee_id text;
