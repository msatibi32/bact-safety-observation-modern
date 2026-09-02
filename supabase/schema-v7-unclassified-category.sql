-- Pelapor tidak mengisi kategori; HSE yang mengklasifikasi di admin.
alter table public.observations drop constraint if exists observations_category_check;
alter table public.observations add constraint observations_category_check
  check (category in (
    'Unsafe Act',
    'Unsafe Condition',
    'Near Miss',
    'Positive Observation',
    'Belum diklasifikasi',
    'Observasi'
  ));
