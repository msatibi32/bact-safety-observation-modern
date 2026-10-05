import { useEffect, useRef, useState } from 'react'
import QRCode from 'react-qr-code'
import { formatJakarta } from '../lib/passes'

const PHASE = {
  pending: {
    label: 'Menunggu persetujuan SPV',
    en: 'Waiting for SPV approval',
    tone: 'bg-amber-50 text-amber-800 ring-amber-200',
  },
  awaiting_hsse: {
    label: 'SPV sudah setuju — menunggu HSSE',
    en: 'SPV approved — waiting for HSSE',
    tone: 'bg-sky-50 text-sky-800 ring-sky-200',
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
  const ticking = Boolean(pass.valid_until || pass.valid_from)
  const now = useNow(ticking)
  const phaseKey = livePhase(pass, now)
  const phase = PHASE[phaseKey] || PHASE.pending
  const clock = countdown(pass, phaseKey, now)

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
        {clock && (
          <div className="mt-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">{clock.label}</p>
            <p className="mt-0.5 font-mono text-2xl font-semibold tabular-nums text-slate-900">{clock.value}</p>
          </div>
        )}
      </div>
      <div className="flex flex-col items-center px-6 py-6">
        <div ref={svgRef} className="rounded-2xl border border-slate-200 bg-white p-4">
          <QRCode value={url} size={196} />
        </div>
        <button type="button" onClick={download} className="btn-primary mt-4 w-full">
          Unduh barcode
          <span className="mt-0.5 block text-[11px] font-normal opacity-80">Download barcode</span>
        </button>
        <p className="mt-3 text-center text-xs text-slate-400">
          Scan menampilkan status, hitung mundur, dan lembar PDF setelah HSSE menyetujui.
        </p>
      </div>
      <dl className="space-y-2 border-t border-slate-100 px-6 py-5 text-sm">
        <Row label="Nama" value={pass.name} />
        <Row label="Perusahaan" value={pass.company} />
        <Row label="Cakupan" value={pass.area} />
        <Row label="Masa berlaku" value={clock ? `${clock.value} · ${pass.lifetime_label}` : pass.lifetime_label} />
        <Row label="Berlaku sampai" value={pass.valid_until ? formatJakarta(pass.valid_until) : 'Setelah disetujui HSSE'} />
        {pass.approved_by && <Row label="Disetujui oleh" value={pass.approved_by} />}
        <Row label="Penerima" value={pass.route_to} />
      </dl>
    </div>
  )
}

function useNow(active) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return undefined
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [active])
  return now
}

function livePhase(pass, now) {
  if (pass.phase === 'pending' || pass.phase === 'rejected' || pass.status === 'Rejected') return pass.phase || 'pending'
  const from = pass.valid_from ? new Date(pass.valid_from).getTime() : null
  const until = pass.valid_until ? new Date(pass.valid_until).getTime() : null
  if (pass.status === 'Approved' || pass.phase === 'valid' || pass.phase === 'scheduled' || pass.phase === 'expired') {
    if (until && now >= until) return 'expired'
    if (from && now < from) return 'scheduled'
    if (until && now < until) return 'valid'
  }
  return pass.phase || 'pending'
}

function countdown(pass, phase, now) {
  if (phase === 'valid' && pass.valid_until) {
    return { label: 'Sisa masa berlaku', value: formatRemain(new Date(pass.valid_until).getTime() - now) }
  }
  if (phase === 'scheduled' && pass.valid_from) {
    return { label: 'Mulai berlaku dalam', value: formatRemain(new Date(pass.valid_from).getTime() - now) }
  }
  if (phase === 'expired' && pass.valid_until) {
    return { label: 'Sisa masa berlaku', value: '00:00:00' }
  }
  return null
}

function formatRemain(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  const pad = (n) => String(n).padStart(2, '0')
  if (days > 0) return `${days} hari ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="max-w-[16rem] text-right text-slate-800">{value || '—'}</dd>
    </div>
  )
}
