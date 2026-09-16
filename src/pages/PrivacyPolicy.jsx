import { Link } from 'react-router-dom'
import BrandHeader from '../components/BrandHeader'
import SiteFooter from '../components/SiteFooter'
import { BRANDING } from '../lib/branding'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-white">
      <div className="mx-auto max-w-xl px-4 py-10">
        <BrandHeader title="Kebijakan privasi" titleEn="Privacy policy" size="sm" />
        <p className="mt-2 text-center text-xs text-slate-400">Berlaku 16 September 2026 · PT. BACT</p>

        <article className="card mt-8 space-y-6 p-5 text-sm leading-relaxed text-slate-700">
          <Section title="1. Pengendali data">
            <p>
              Pengendali data adalah <strong>{BRANDING.legalName}</strong> ({BRANDING.fullName}), untuk
              aplikasi Safety Observation Card (SOC).
            </p>
            <p className="text-xs text-slate-500">
              Data controller: PT. BACT, for the Safety Observation Card used in occupational safety
              reporting at Batu Ampar Container Terminal.
            </p>
          </Section>

          <Section title="2. Data yang dikumpulkan">
            <ul className="list-disc space-y-1 pl-5">
              <li>Identitas pelapor: nama, perusahaan, departemen, ID karyawan BACT (jika dipilih dari daftar).</li>
              <li>Isi observasi: tanggal, lokasi, deskripsi, Stop Work, foto bukti.</li>
              <li>Akun admin: email dan kata sandi (disimpan ter-hash oleh Supabase Auth).</li>
              <li>Jejak audit HSE: siapa yang mengubah, menutup, atau menginvestigasi laporan.</li>
            </ul>
            <p className="mt-2 text-xs text-slate-500">
              We do not ask for anonymous reports. Category and risk are filled by HSE, not by the
              reporter. Photos are evidence of a workplace observation.
            </p>
          </Section>

          <Section title="3. Tujuan">
            <p>
              Data dipakai untuk tindak lanjut HSSE (klasifikasi, investigasi, CAPA, analitik, PDF
              SOC/investigasi, dan notifikasi email ke petugas yang ditunjuk). Bukan untuk pemasaran.
            </p>
          </Section>

          <Section title="4. Siapa yang melihat">
            <p>
              Super Admin, HSE Officer, dan Viewer sesuai peran. Email notifikasi (laporan baru / HiPo)
              dikirim ke alamat yang Super Admin daftarkan di menu Notifications.
            </p>
          </Section>

          <Section title="5. Pemroses (penyedia layanan)">
            <ul className="list-disc space-y-1 pl-5">
              <li>Vercel — hosting situs (HTTPS).</li>
              <li>Supabase — basis data, autentikasi, penyimpanan foto.</li>
              <li>Resend — pengiriman email transaksional. Jalur lama Brevo dapat masih tercatat di log.</li>
            </ul>
            <p className="mt-2 text-xs text-slate-500">
              Hostinger, if later used, is for website/domain/mailbox to read mail — not the SOC
              database.
            </p>
          </Section>

          <Section title="6. Penyimpanan">
            <p>
              Laporan disimpan selama diperlukan untuk kewajiban HSSE dan audit internal, lalu dapat
              diarsip atau dihapus oleh Super Admin. Foto bukti mengikuti kebijakan retensi yang sama.
            </p>
          </Section>

          <Section title="7. Hak Anda (UU 27/2022 PDP)">
            <p>
              Anda dapat meminta akses, koreksi, atau penghapusan data pelaporan melalui HSE / Super
              Admin, sepanjang tidak bertentangan dengan kewajiban keselamatan dan audit.
            </p>
          </Section>

          <Section title="8. Keamanan">
            <p>
              Situs memakai HTTPS, header keamanan, login admin, dan pembatasan peran. Ini praktik
              pengamanan web standar, bukan sertifikat ISO/SOC 2.
            </p>
          </Section>

          <Section title="9. Kontak">
            <p>
              Pertanyaan privasi: tim HSSE {BRANDING.legalName} melalui Super Admin aplikasi, atau email
              yang terdaftar di notifikasi HSSE.
            </p>
          </Section>
        </article>

        <p className="mt-6 text-center text-sm">
          <Link to="/" className="font-medium text-brand-600 hover:underline">
            Kembali ke form
          </Link>
        </p>
        <SiteFooter />
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  )
}
