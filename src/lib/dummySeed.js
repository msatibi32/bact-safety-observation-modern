/** Fingerprints of rows created by scripts/seed-dummy-soc.mjs — name + description start. */
export const DUMMY_SEED_FINGERPRINTS = [
  { name: 'Riki Mulyadi', desc: 'Dua pekerja ditemukan duduk di dermaga' },
  { name: 'Budi Santoso', desc: 'Tumpukan pallet rusak dan serpihan kayu' },
  { name: 'Siti Aminah', desc: 'Truk eksternal hampir menabrak petugas' },
  { name: 'Andi Wijaya', desc: 'Tim maintenance memakai APD lengkap' },
  { name: 'Imamuddin', desc: 'Driver merokok di kabin truk' },
  { name: 'Dewi Lestari', desc: 'Kabel charging ETT terkelupas' },
  { name: 'Hendra Gunawan', desc: 'Operator RTG menaikkan spreader' },
  { name: 'Rina Kusuma', desc: 'Kabel ekstensi berserakan di lantai' },
  { name: 'Agus Pratama', desc: 'Pekerja tally berjalan di antara stack' },
  { name: 'Fajar Nugroho', desc: 'Saat pengujian genset, pintu panel' },
]

export function isDummySeedObservation(obs) {
  const name = String(obs?.nama_pelapor || '').trim()
  const desc = String(obs?.deskripsi || '')
  return DUMMY_SEED_FINGERPRINTS.some((f) => name === f.name && desc.startsWith(f.desc))
}
