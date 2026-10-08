/**
 * Penanggung jawab CAPA per departemen.
 * Isi hanya setelah Rano menuliskan nama, jabatan, dan email.
 * Jangan menyalin ejaan dari transkrip rapat.
 * Satu departemen boleh lebih dari satu orang.
 * Jangan memasukkan HSSE — HSSE menerima salinan, bukan menutup pekerjaan.
 *
 * Bentuk tiap baris:
 * { id: 'unik', name: 'Nama lengkap', title: 'Jabatan', department: 'Engineering', email: 'nama@perusahaan.com' }
 */
export const DEPARTMENT_HEADS = []

export function assignableDepartmentHeads() {
  return DEPARTMENT_HEADS.filter((person) => {
    const name = String(person?.name || '').trim()
    const email = String(person?.email || '').trim()
    const department = String(person?.department || '').trim().toLowerCase()
    if (!person?.id || !name || !email.includes('@')) return false
    if (department === 'hsse' || department === 'hse') return false
    return true
  })
}
