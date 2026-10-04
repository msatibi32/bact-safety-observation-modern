import { useRef } from 'react'
import QRCode from 'react-qr-code'
import { formatJakarta } from '../lib/passes'

const PHASE = {
  pending: {
    label: 'Menunggu persetujuan HSSE',
    en: 'Waiting for HSSE approval',
    tone: 'bg-amber-50 text-amber-800 ring-amber-200',
  },
  scheduled: {
    label: 'Disetujui — belum mulai berlaku',
    en: 'Approved — not valid yet',
    tone: 'bg-sky-50 text-sky-800 ring-sky-200',
  },
  valid: {
    label: 'Disetujui HSSE — masih berlaku',
    en: 'Approved by HSSE — within lifetime',
    tone: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  },
  expired: {
    label: 'Masa berlaku habis',
    en: 'Lifetime ended',
    tone: 'bg-slate-100 text-slate-600 ring-slate-200',
  },
  rejected: {
    label: 'Ditolak HSSE',
    en: 'Rejected by HSSE',
    tone: 'bg-red-50 text-red-700 ring-red-200',
  },
}

export default function PassCard({ pass, url }) {
  const svgRef = useRef(null)
  const phase = PHASE[pass.phase] || PHASE.pending

  function download() {
    const svg = svgRef.current?.querySelector('svg')
    if (!svg) return
    const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${pass.ref_no || 'pass'}.svg`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="card w-full max-w-md overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-5 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">{pass.type_label}</p>
        <h1 className="mt-1 font-mono text-lg font-semibold text-slate-900">{pass.ref_no}</h1>
        <p className={`mx-auto mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${phase.tone}`}>
          {phase.label}
        </p>
        <p className="mt-1 text-[11px] text-slate-400">{phase.en}</p>
      </div>
      <div className="flex flex-col items-center px-6 py-6">
        <div ref={svgRef} className="rounded-2xl border border-slate-200 bg-white p-4">
          <QRCode value={url} size={196} />
        </div>
        <button type="button" onClick={download} className="btn-primary mt-4 w-full">
          Unduh barcode
          <span className="mt-0.5 block text-[11px] font-normal opacity-80">Download barcode</span>
        </button>
        <p className="mt-3 text-center text-xs text-slate-400">Scan menampilkan status persetujuan HSSE dan masa berlaku.</p>
      </div>
      <dl className="space-y-2 border-t border-slate-100 px-6 py-5 text-sm">
        <Row label="Nama" value={pass.name} />
        <Row label="Perusahaan" value={pass.company} />
        <Row label="Cakupan" value={pass.area} />
        <Row label="Masa berlaku" value={pass.lifetime_label} />
        <Row label="Berlaku sampai" value={pass.valid_until ? formatJakarta(pass.valid_until) : 'Setelah disetujui HSSE'} />
        {pass.approved_by && <Row label="Disetujui oleh" value={pass.approved_by} />}
        <Row label="Penerima" value={pass.route_to} />
      </dl>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="max-w-[16rem] text-right text-slate-800">{value || '—'}</dd>
    </div>
  )
}
