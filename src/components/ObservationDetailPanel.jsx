import { useState } from 'react'
import AuditTrail from './AuditTrail'
import { HiPoBadge, RiskBadge, StatusBadge } from './Badge'
import CapaPanel from './CapaPanel'
import { BuildingIcon, PinIcon } from './Icon'
import { PIC_OPTIONS, STATUS_OPTIONS } from '../lib/constants'

const TABS = ['Detail', 'Investigasi', 'CAPA', 'Audit']

export default function ObservationDetailPanel({ observation, onSave }) {
  const [tab, setTab] = useState('Detail')
  const [pic, setPic] = useState(observation.pic_assigned || '')
  const [status, setStatus] = useState(observation.status)
  const [catatan, setCatatan] = useState(observation.catatan_penutupan || '')
  const [triageNotes, setTriageNotes] = useState(observation.triage_notes || '')
  const [investigationNotes, setInvestigationNotes] = useState(observation.investigation_notes || '')
  const [rootCause, setRootCause] = useState(observation.root_cause || '')
  const [verificationNotes, setVerificationNotes] = useState(observation.verification_notes || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await onSave(observation.id, {
        pic_assigned: pic,
        status,
        catatan_penutupan: catatan,
        triage_notes: triageNotes,
        investigation_notes: investigationNotes,
        root_cause: rootCause,
        verification_notes: verificationNotes,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } catch (err) {
      setError(err.message || 'Gagal menyimpan.')
    } finally {
      setSaving(false)
    }
  }

  const needsInvestigation = observation.is_hipo || observation.tingkat_risiko === 'High'

  return (
    <div className="flex max-h-none flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 md:max-h-[calc(100vh-12rem)]">
      <div className="shrink-0 space-y-3 border-b border-slate-800 p-4 pb-3 md:p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold text-slate-100">{observation.nama_pelapor}</h2>
              {observation.is_hipo && <HiPoBadge />}
              {observation.stop_work && (
                <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-medium text-white">Stop Work</span>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
              <BuildingIcon className="h-3.5 w-3.5" />
              {observation.departemen}
              {observation.nama_perusahaan ? ` · ${observation.nama_perusahaan}` : ''}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <RiskBadge level={observation.tingkat_risiko} />
            <StatusBadge status={observation.status} />
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                tab === t ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-800'
              }`}
            >
              {t}
              {t === 'Investigasi' && needsInvestigation && (
                <span className="ml-1 text-red-300">*</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {tab === 'Detail' && (
          <div className="space-y-4">
            <dl className="space-y-2.5 text-sm">
              <DetailRow icon={<PinIcon className="h-3.5 w-3.5" />} label="Lokasi" value={observation.lokasi_teks} />
              {observation.lokasi_gps && (
                <DetailRow
                  label="GPS"
                  value={`${observation.lokasi_gps.lat.toFixed(5)}, ${observation.lokasi_gps.lng.toFixed(5)}`}
                />
              )}
              <DetailRow label="Kategori" value={observation.kategori} />
              <DetailRow label="Risiko aktual" value={observation.tingkat_risiko} />
              <DetailRow label="Potensi risiko" value={observation.potensi_risiko} />
              <DetailRow label="Life Saving Rule" value={observation.life_saving_rule} />
              <DetailRow label="Deskripsi" value={observation.deskripsi} />
              {observation.tindakan_langsung && (
                <DetailRow label="Tindakan langsung" value={observation.tindakan_langsung} />
              )}
              {observation.rekomendasi && <DetailRow label="Rekomendasi" value={observation.rekomendasi} />}
            </dl>

            {observation.foto?.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {observation.foto.map((src, i) => (
                  <a key={i} href={src} target="_blank" rel="noreferrer">
                    <img src={src} alt={`Bukti ${i + 1}`} className="aspect-square rounded-lg object-cover" />
                  </a>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 border-t border-slate-800 pt-4">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-400">PIC follow-up</span>
                <select value={pic} onChange={(e) => setPic(e.target.value)} className="admin-input">
                  <option value="">— Belum di-assign —</option>
                  {PIC_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-400">Status workflow</span>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="admin-input">
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-400">Catatan triage HSE</span>
                <textarea rows={2} value={triageNotes} onChange={(e) => setTriageNotes(e.target.value)} className="admin-input" placeholder="Review awal severity & prioritas…" />
              </label>

              {(status === 'Closed' || status === 'Pending Verification') && (
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-400">Catatan penutupan</span>
                  <textarea rows={2} value={catatan} onChange={(e) => setCatatan(e.target.value)} className="admin-input" placeholder="Tindakan yang sudah dilakukan…" />
                </label>
              )}

              {status === 'Pending Verification' && (
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-400">Verifikasi efektivitas</span>
                  <textarea rows={2} value={verificationNotes} onChange={(e) => setVerificationNotes(e.target.value)} className="admin-input" placeholder="Bukti tindakan efektif…" />
                </label>
              )}

              {error && <p className="text-sm text-red-400">{error}</p>}
              <button type="submit" disabled={saving} className="btn-primary w-full">
                {saving ? 'Menyimpan…' : saved ? 'Tersimpan ✓' : 'Simpan perubahan'}
              </button>
            </form>
          </div>
        )}

        {tab === 'Investigasi' && (
          <form onSubmit={handleSubmit} className="space-y-3">
            {needsInvestigation && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                Laporan HiPo / High Risk — investigasi wajib (5 Whys / root cause).
              </div>
            )}
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-700">Catatan investigasi</span>
              <textarea rows={4} value={investigationNotes} onChange={(e) => setInvestigationNotes(e.target.value)} className="admin-input" placeholder="Temuan investigasi, saksi, kondisi lapangan…" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-700">Root cause (5 Whys)</span>
              <textarea rows={4} value={rootCause} onChange={(e) => setRootCause(e.target.value)} className="admin-input" placeholder="Akar penyebab utama…" />
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={saving} className="btn-primary w-full">
              {saving ? 'Menyimpan…' : 'Simpan investigasi'}
            </button>
          </form>
        )}

        {tab === 'CAPA' && <CapaPanel observationId={observation.id} />}
        {tab === 'Audit' && <AuditTrail observationId={observation.id} />}
      </div>
    </div>
  )
}

function DetailRow({ icon, label, value }) {
  return (
    <div>
      <dt className="flex items-center gap-1 text-xs font-medium text-slate-400">
        {icon}
        {label}
      </dt>
      <dd className="text-slate-300">{value}</dd>
    </div>
  )
}
