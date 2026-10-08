import { Link } from 'react-router-dom'
import { BRANDING } from '../lib/branding'
import { OBSERVATION_TYPES } from '../lib/constants'

const YARD = ['Jetty', 'CY/A', 'CY/B', 'CY/C', 'Gate IN', 'Gate Out', 'Workshop', 'ETT Charging']

const ZONES = [
  {
    code: 'QAY',
    title: 'Jetty',
    titleEn: 'Quay',
    body: 'Bongkar muat di dermaga. Observasi di sini ditandai langsung pada lokasi Jetty.',
  },
  {
    code: 'CY',
    title: 'Container yard',
    titleEn: 'Lapangan peti kemas',
    body: 'Blok CY/A sampai CY/J. Kartu mencatat blok tempat kondisi atau tindakan itu terlihat.',
  },
  {
    code: 'GT',
    title: 'Gate',
    titleEn: 'Gerbang truk',
    body: 'Gate IN dan Gate Out. Antrean, pemeriksaan, dan pergerakan truk masuk di kartu yang sama.',
  },
  {
    code: 'WS',
    title: 'Workshop',
    titleEn: 'Bengkel dan alat',
    body: 'Workshop, ETT Charging, dan area alat. Perawatan tetap lewat jalur observasi yang sama.',
  },
]

const STEPS = [
  {
    n: '01',
    bay: 'Dermaga',
    title: 'Laporkan di tempat',
    titleEn: 'Report on the spot',
    body: 'Perusahaan, nama, lokasi, jenis pengamatan, deskripsi, saran, dan foto. Tanpa akun. Stop Work bisa ditandai.',
  },
  {
    n: '02',
    bay: 'Klasifikasi',
    title: 'HSE mengklasifikasi',
    titleEn: 'HSE classifies',
    body: 'Kartu masuk sebagai belum diklasifikasi. HSE mengisi jenis dan tingkat risiko, lalu menunjuk satu kepala departemen bila perlu CAPA.',
  },
  {
    n: '03',
    bay: 'Penutupan',
    title: 'Departemen menutup',
    titleEn: 'The department closes it',
    body: 'Tindak lanjut lewat tautan yang sama: batas waktu, status, catatan, dan foto saat pekerjaan ditutup.',
  },
]

const BOXES = [
  { color: '#1c6b66', door: '#145550' },
  { color: '#d4651a', door: '#a84b10' },
  { color: '#9d2438', door: '#741828' },
  { color: '#1b3d66', door: '#122a48' },
  { color: '#3e4a3c', door: '#2a3328' },
]

const SERVICES = [
  {
    to: '/lapor',
    code: 'SOC',
    title: 'Kartu observasi',
    body: 'Tindakan aman, tindakan tidak aman, kondisi tidak aman, near miss, dan saran.',
  },
  {
    to: '/ptw',
    code: 'PTW',
    title: 'Izin kerja',
    body: 'Pengajuan permit to work untuk pekerjaan yang memerlukan persetujuan HSSE.',
  },
  {
    to: '/visit',
    code: 'VIS',
    title: 'Kunjungan',
    body: 'Permohonan kunjungan untuk Corporate Communication HSSE, lengkap dengan identitas tamu.',
  },
  {
    to: '/admin/login',
    code: 'HSE',
    title: 'Portal HSE',
    body: 'Dashboard klasifikasi, CAPA, insiden, man hours, audit, dan modul operasional lain.',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#ece7df] text-[#141820]">
      <div className="hazard-stripe" aria-hidden="true" />
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#071018]/95 text-white backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <Link to="/" className="shrink-0" aria-label="Beranda PT. BACT">
            <img src={BRANDING.logoSrc} alt={BRANDING.logoAlt} className="h-8 w-auto" />
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-slate-300 lg:flex" aria-label="Utama">
            <a href="#lapangan" className="hover:text-white">Lapangan</a>
            <a href="#alur" className="hover:text-white">Alur</a>
            <a href="#jenis" className="hover:text-white">Jenis laporan</a>
            <a href="#layanan" className="hover:text-white">Layanan</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/admin/login" className="rounded-full px-3 py-2 text-sm font-medium text-slate-300 hover:text-white">
              Masuk
            </Link>
            <Link to="/lapor" className="btn-primary px-4 py-2 text-sm">
              Laporkan
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-[#071018] text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgb(243_112_33/0.22),transparent_32%)]" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 lg:grid-cols-12 lg:py-20">
            <div className="lg:col-span-6">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-400">
                {BRANDING.legalName} · Bongkar muat peti kemas
              </p>
              <h1 className="mt-5 max-w-xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.35rem]">
                Setiap observasi di terminal punya jalur sampai ditutup.
              </h1>
              <p className="mt-4 text-base text-slate-400">
                Every observation on the terminal has a path to closure.
              </p>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-300">
                Dari jetty, container yard, sampai gate. Karyawan, vendor, dan tamu mengirim kartu tanpa login. HSE mengklasifikasi. Kepala departemen yang ditunjuk menutup pekerjaan.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/lapor" className="btn-primary">
                  Laporkan dari lapangan
                </Link>
                <Link
                  to="/admin/login"
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:border-white/40"
                >
                  Masuk portal HSE
                </Link>
              </div>
            </div>
            <div className="lg:col-span-6">
              <YardScene />
            </div>
          </div>
          <div className="relative border-t border-white/10">
            <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
              <p className="shrink-0 font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">Lokasi di form</p>
              <ul className="flex flex-wrap gap-2">
                {YARD.map((name) => (
                  <li key={name} className="rounded-sm border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[11px] text-slate-300">
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="lapangan" className="scroll-mt-20 mx-auto max-w-6xl px-5 py-16 lg:py-20">
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-600">Lapangan</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Empat zona tempat kartu itu lahir.</h2>
            <p className="mt-2 text-sm text-slate-500">Four places a card can start.</p>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {ZONES.map((zone) => (
              <li key={zone.code} className="overflow-hidden rounded-sm border border-black/10 bg-white">
                <div className="flex items-stretch">
                  <div className="flex w-16 shrink-0 items-center justify-center bg-[#071018] font-mono text-sm font-semibold text-brand-400">
                    {zone.code}
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-semibold">{zone.title}</h3>
                    <p className="mt-0.5 text-xs text-slate-400">{zone.titleEn}</p>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{zone.body}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section id="alur" className="scroll-mt-20 border-y border-black/10 bg-[#071018] text-white">
          <div className="mx-auto max-w-6xl px-5 py-16 lg:py-20">
            <div className="max-w-2xl">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-400">Alur kartu</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Seperti peti kemas: masuk, dipindah, lalu ditutup.</h2>
              <p className="mt-2 text-sm text-slate-400">In, moved, then closed.</p>
            </div>
            <ol className="mt-10 grid gap-4 lg:grid-cols-3">
              {STEPS.map((step) => (
                <li key={step.n} className="border border-white/10 bg-white/[0.03] p-6">
                  <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.18em] text-brand-400">
                    <span>{step.n}</span>
                    <span>{step.bay}</span>
                  </div>
                  <h3 className="mt-6 text-xl font-semibold">{step.title}</h3>
                  <p className="mt-1 text-xs text-slate-400">{step.titleEn}</p>
                  <p className="mt-4 text-sm leading-relaxed text-slate-300">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="jenis" className="scroll-mt-20">
          <div className="mx-auto max-w-6xl px-5 py-16 lg:py-20">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-2xl">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-600">Jenis laporan</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight">Lima peti. Pelapor yang memilih pintunya.</h2>
                <p className="mt-2 text-sm text-slate-500">Five boxes. The reporter picks the door.</p>
              </div>
              <Link to="/lapor" className="text-sm font-semibold text-brand-700 hover:underline">
                Isi kartu
              </Link>
            </div>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {OBSERVATION_TYPES.map((type, index) => (
                <li key={type.value}>
                  <ContainerFace
                    code={`SOC-0${index + 1}`}
                    color={BOXES[index].color}
                    door={BOXES[index].door}
                    title={type.label}
                    titleEn={type.labelEn}
                    body={type.hint}
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="layanan" className="scroll-mt-20 border-t border-black/10 bg-white">
          <div className="mx-auto max-w-6xl px-5 py-16 lg:py-20">
            <div className="max-w-2xl">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-600">Layanan</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Manifest HSSE di terminal ini.</h2>
              <p className="mt-2 text-sm text-slate-500">The HSSE manifest for this terminal.</p>
            </div>
            <ul className="mt-10 divide-y divide-black/10 border-y border-black/10">
              {SERVICES.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="group grid gap-3 py-6 sm:grid-cols-[5rem_1fr_auto] sm:items-center">
                    <span className="font-mono text-sm font-semibold tracking-[0.18em] text-brand-600">{item.code}</span>
                    <span>
                      <span className="block text-lg font-semibold group-hover:text-brand-700">{item.title}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-slate-600">{item.body}</span>
                    </span>
                    <span className="text-sm font-semibold text-slate-400 group-hover:text-brand-600">Buka</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="bg-[#071018] text-slate-400">
        <div className="hazard-stripe" aria-hidden="true" />
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <img src={BRANDING.logoSrc} alt="" className="h-8 w-auto" />
            <p className="mt-4 text-sm text-slate-300">
              {BRANDING.legalName} — {BRANDING.fullName}
            </p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em]">HSSE · Bongkar muat peti kemas</p>
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

function ContainerFace({ code, color, door, title, titleEn, body }) {
  return (
    <article className="relative min-h-52 overflow-hidden text-white shadow-lg shadow-black/10" style={{ backgroundColor: color }}>
      <div className="yard-corrugation absolute inset-0" />
      <span className="absolute left-2 top-2 h-2.5 w-2.5 bg-black/80" />
      <span className="absolute bottom-2 left-2 h-2.5 w-2.5 bg-black/80" />
      <span className="absolute right-12 top-2 h-2.5 w-2.5 bg-black/80" />
      <span className="absolute bottom-2 right-12 h-2.5 w-2.5 bg-black/80" />
      <div className="absolute inset-y-0 right-0 w-10" style={{ backgroundColor: door }}>
        <span className="absolute left-1/2 top-6 h-10 w-1 -translate-x-1/2 bg-black/30" />
        <span className="absolute left-1/2 bottom-6 h-10 w-1 -translate-x-1/2 bg-black/30" />
      </div>
      <div className="relative max-w-[calc(100%-3rem)] p-5">
        <p className="font-mono text-[11px] tracking-[0.22em] text-white/70">{code}</p>
        <h3 className="mt-4 text-xl font-semibold">{title}</h3>
        <p className="mt-1 text-xs text-white/70">{titleEn}</p>
        <p className="mt-3 text-sm leading-relaxed text-white/85">{body}</p>
      </div>
    </article>
  )
}

function Box({ x, y, w, h, fill }) {
  const ribs = []
  for (let i = 8; i < w - 4; i += 10) ribs.push(i)
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={fill} />
      {ribs.map((offset) => (
        <rect key={offset} x={x + offset} y={y} width="2" height={h} fill="rgb(0 0 0 / 0.18)" />
      ))}
      <rect x={x + 3} y={y + 3} width="5" height="5" fill="#111" />
      <rect x={x + w - 8} y={y + 3} width="5" height="5" fill="#111" />
      <rect x={x + 3} y={y + h - 8} width="5" height="5" fill="#111" />
      <rect x={x + w - 8} y={y + h - 8} width="5" height="5" fill="#111" />
    </g>
  )
}

function YardScene() {
  return (
    <div className="relative overflow-hidden border border-white/10">
      <svg viewBox="0 0 640 460" className="w-full" role="img" aria-label="Ilustrasi dermaga, crane, dan tumpukan peti kemas">
        <rect width="640" height="460" fill="#0b1520" />
        <rect y="338" width="280" height="122" fill="#0c3144" />
        <path d="M0 338h300l-40 28H0Z" fill="#12384c" />
        <rect x="250" y="300" width="390" height="160" fill="#121a22" />
        <rect x="250" y="292" width="390" height="8" fill="#f37021" />
        <g fill="#1c2833">
          <rect x="270" y="328" width="54" height="4" />
          <rect x="344" y="328" width="54" height="4" />
          <rect x="418" y="328" width="54" height="4" />
          <rect x="492" y="328" width="54" height="4" />
          <rect x="566" y="328" width="54" height="4" />
        </g>

        <path d="M18 286h210l28 52H18Z" fill="#182838" />
        <rect x="36" y="248" width="150" height="38" fill="#203246" />
        <rect x="150" y="214" width="28" height="34" fill="#2a4158" />
        <rect x="156" y="198" width="16" height="16" fill="#f37021" />
        <Box x={48} y={196} w={78} h={52} fill="#1c6b66" />
        <Box x={132} y={214} w={62} h={34} fill="#9d2438" />

        <g>
          <rect x="214" y="86" width="16" height="214" fill="#e6ebf0" />
          <rect x="196" y="292" width="52" height="10" fill="#9aa3ad" />
          <rect x="86" y="72" width="390" height="12" fill="#f37021" />
          <rect x="92" y="84" width="8" height="22" fill="#e6ebf0" />
          <rect x="460" y="84" width="8" height="22" fill="#e6ebf0" />
          <rect x="248" y="84" width="28" height="12" fill="#f7f4ee" />
          <line x1="256" y1="96" x2="256" y2="168" stroke="#f7f4ee" strokeWidth="1.5" />
          <line x1="268" y1="96" x2="268" y2="168" stroke="#f7f4ee" strokeWidth="1.5" />
          <rect x="238" y="168" width="52" height="8" fill="#c5ccd4" />
          <Box x={232} y={176} w={64} h={36} fill="#f37021" />
        </g>

        <Box x={360} y={236} w={78} h={56} fill="#1b3d66" />
        <Box x={444} y={236} w={78} h={56} fill="#9d2438" />
        <Box x={528} y={258} w={78} h={34} fill="#d4651a" />
        <Box x={360} y={174} w={78} h={62} fill="#d4651a" />
        <Box x={444} y={174} w={78} h={62} fill="#1c6b66" />
        <Box x={360} y={112} w={78} h={62} fill="#3e4a3c" />
        <circle cx="222" cy="78" r="4" fill="#f37021" />
        <circle cx="470" cy="78" r="4" fill="#f37021" />
      </svg>
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-black/60 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-200">
        <span>BACT · Jetty</span>
        <span className="text-brand-400">STS · Container yard</span>
      </div>
    </div>
  )
}
