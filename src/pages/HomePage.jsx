import { Link } from 'react-router-dom'
import { BRANDING } from '../lib/branding'
import { OBSERVATION_TYPES } from '../lib/constants'

const STEPS = [
  {
    n: '01',
    title: 'Laporkan di tempat',
    titleEn: 'Report on the spot',
    body: 'Perusahaan, nama, lokasi, jenis pengamatan, deskripsi, saran, dan foto. Tanpa akun. Stop Work bisa ditandai.',
  },
  {
    n: '02',
    title: 'HSE mengklasifikasi',
    titleEn: 'HSE classifies',
    body: 'Kartu masuk sebagai belum diklasifikasi. HSE mengisi jenis dan tingkat risiko, lalu menunjuk satu kepala departemen bila perlu CAPA.',
  },
  {
    n: '03',
    title: 'Departemen menutup',
    titleEn: 'The department closes it',
    body: 'Tindak lanjut lewat tautan yang sama: batas waktu, status, catatan, dan foto saat pekerjaan ditutup.',
  },
]

const SERVICES = [
  {
    to: '/lapor',
    kicker: 'SOC',
    title: 'Kartu observasi',
    body: 'Tindakan aman, tindakan tidak aman, kondisi tidak aman, near miss, dan saran.',
  },
  {
    to: '/ptw',
    kicker: 'PTW',
    title: 'Izin kerja',
    body: 'Pengajuan permit to work untuk pekerjaan yang memerlukan persetujuan HSSE.',
  },
  {
    to: '/visit',
    kicker: 'Visit',
    title: 'Kunjungan',
    body: 'Permohonan kunjungan untuk Corporate Communication HSSE, lengkap dengan identitas tamu.',
  },
  {
    to: '/admin/login',
    kicker: 'Portal',
    title: 'Masuk HSE',
    body: 'Dashboard klasifikasi, CAPA, insiden, man hours, audit, dan modul operasional lain.',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f4f1eb] text-[#141820]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0c1018]/95 text-white backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <Link to="/" className="flex items-center gap-3" aria-label="Beranda PT. BACT">
            <img
              src={BRANDING.logoSrc}
              alt={BRANDING.logoAlt}
              className="h-8 w-auto"
            />
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-slate-300 md:flex" aria-label="Utama">
            <a href="#alur" className="hover:text-white">Alur</a>
            <a href="#jenis" className="hover:text-white">Jenis laporan</a>
            <a href="#layanan" className="hover:text-white">Layanan</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/login"
              className="rounded-full px-3 py-2 text-sm font-medium text-slate-300 hover:text-white"
            >
              Masuk
            </Link>
            <Link to="/lapor" className="btn-primary px-4 py-2 text-sm">
              Laporkan
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-[#0c1018] text-white">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 top-0 h-[28rem] w-[28rem] rounded-full bg-brand-500/20 blur-3xl"
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-12 lg:py-24">
            <div className="lg:col-span-7">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-400">
                {BRANDING.fullName}
              </p>
              <h1 className="mt-5 max-w-xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
                Observasi keselamatan, dari lapangan sampai ditutup.
              </h1>
              <p className="mt-3 text-base text-slate-400">
                Safety observations, from the yard to closure.
              </p>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-300">
                Karyawan, vendor, dan tamu mengirim kartu tanpa login. HSE mengklasifikasi.
                Kepala departemen yang ditunjuk menutup pekerjaan dengan catatan dan foto.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/lapor" className="btn-primary">
                  Laporkan observasi
                </Link>
                <Link
                  to="/admin/login"
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:border-white/40"
                >
                  Masuk portal HSE
                </Link>
              </div>
            </div>

            <aside className="lg:col-span-5">
              <div className="rounded-3xl border border-white/10 bg-white p-6 text-[#141820] shadow-2xl shadow-black/40">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Contoh kartu</p>
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                    Belum diklasifikasi
                  </span>
                </div>
                <p className="mt-4 text-lg font-semibold">Container yard, area dermaga</p>
                <p className="mt-1 text-sm text-slate-500">Sample card · not a live report</p>
                <dl className="mt-5 space-y-3 border-t border-slate-100 pt-5 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Jenis</dt>
                    <dd className="text-right font-medium">Kondisi tidak aman</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Stop Work</dt>
                    <dd className="font-medium">Tidak</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Pelapor</dt>
                    <dd className="font-medium">Disembunyikan</dd>
                  </div>
                </dl>
                <p className="mt-5 text-sm leading-relaxed text-slate-600">
                  HSE menunjuk satu kepala departemen. HSSE menerima salinan. Yang menutup kartu adalah departemen yang ditunjuk.
                </p>
              </div>
            </aside>
          </div>
        </section>

        <section id="alur" className="scroll-mt-20 mx-auto max-w-6xl px-5 py-16 lg:py-20">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-600">Alur</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Tiga langkah, satu kartu.</h2>
            <p className="mt-2 text-sm text-slate-500">Three steps, one card.</p>
          </div>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {STEPS.map((step) => (
              <li key={step.n} className="rounded-3xl border border-black/5 bg-white p-6">
                <p className="text-sm font-semibold text-brand-600">{step.n}</p>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-1 text-xs text-slate-400">{step.titleEn}</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="jenis" className="scroll-mt-20 border-y border-black/5 bg-white">
          <div className="mx-auto max-w-6xl px-5 py-16 lg:py-20">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-600">Jenis laporan</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Pelapor memilih jenisnya sendiri.</h2>
              <p className="mt-2 text-sm text-slate-500">The reporter chooses the observation type.</p>
            </div>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {OBSERVATION_TYPES.map((type) => (
                <li key={type.value} className="rounded-3xl border border-slate-200 p-6">
                  <h3 className="text-base font-semibold">{type.label}</h3>
                  <p className="mt-1 text-xs text-slate-400">{type.labelEn}</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{type.hint}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="layanan" className="scroll-mt-20 mx-auto max-w-6xl px-5 py-16 lg:py-20">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-600">Layanan</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Yang bisa dikerjakan dari situs ini.</h2>
            <p className="mt-2 text-sm text-slate-500">What this site is for.</p>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {SERVICES.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="group flex h-full flex-col rounded-3xl border border-black/5 bg-white p-6 transition hover:border-brand-500/40"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">{item.kicker}</p>
                  <h3 className="mt-3 text-xl font-semibold group-hover:text-brand-700">{item.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{item.body}</p>
                  <span className="mt-5 text-sm font-semibold text-brand-600">Buka</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-black/5 bg-[#0c1018] text-slate-400">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <img src={BRANDING.logoSrc} alt="" className="h-8 w-auto" />
            <p className="mt-4 text-sm text-slate-300">
              {BRANDING.legalName} — {BRANDING.fullName}
            </p>
            <p className="mt-1 text-xs">© {new Date().getFullYear()} HSSE</p>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Kaki situs">
            <Link to="/lapor" className="hover:text-white">Laporkan</Link>
            <Link to="/admin/login" className="hover:text-white">Masuk</Link>
            <Link to="/privacy" className="hover:text-white">Privasi</Link>
            <Link to="/cookies" className="hover:text-white">Cookies</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
