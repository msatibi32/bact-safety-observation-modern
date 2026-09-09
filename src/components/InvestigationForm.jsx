import { buildSummary5W1H } from '../lib/investigation'

const W5H1_FIELDS = [
  { key: 'what', label: 'WHAT — Apa insiden/potensi bahaya utamanya?' },
  { key: 'where', label: 'WHERE — Di mana lokasi spesifik & kerentanan areanya?' },
  { key: 'when', label: 'WHEN — Kapan kejadian & kapan terakhir pengawasan?' },
  { key: 'why', label: 'WHY — Mengapa bahaya muncul tanpa terdeteksi?' },
  { key: 'how', label: 'HOW — Bagaimana bahaya berkembang hingga Stop Work / eskalasi?' },
]

const WHY_FIELDS = [
  { key: 'why1', label: 'Why 1 (Gejala Lapangan)' },
  { key: 'why2', label: 'Why 2 (Kegagalan Pemeriksaan)' },
  { key: 'why3', label: 'Why 3 (Kegagalan Prosedur/Individu)' },
  { key: 'why4', label: 'Why 4 (Kegagalan Pengawasan & Kontrol)' },
  { key: 'why5', label: 'Why 5 (Akar Masalah Utama / Systemic)' },
]

export default function InvestigationForm({ data, onChange, disabled }) {
  function setField(key, value) {
    const next = { ...data, [key]: value }
    if (['what', 'where', 'when', 'why', 'how'].includes(key)) {
      next.summary_5w1h = buildSummary5W1H(next)
    }
    onChange(next)
  }

  return (
    <fieldset disabled={disabled} className="space-y-5 disabled:opacity-60">
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">1. Analisis Root Cause (5W + 1H)</h3>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Pemetaan fakta & identifikasi kegagalan — format seragam untuk semua tim HSE.
          </p>
        </div>
        {W5H1_FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-1 block text-xs font-medium text-slate-400">{f.label}</span>
            <textarea
              rows={2}
              value={data[f.key] || ''}
              onChange={(e) => setField(f.key, e.target.value)}
              className="admin-input"
            />
          </label>
        ))}
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-400">
            Ringkasan 5W+1H (kalimat hasil)
          </span>
          <textarea
            rows={3}
            value={data.summary_5w1h || ''}
            onChange={(e) => setField('summary_5w1h', e.target.value)}
            className="admin-input"
            placeholder="Otomatis terisi dari kolom di atas — bisa disunting."
          />
        </label>
      </section>

      <section className="space-y-3 border-t border-slate-800 pt-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">2. Deep Dive (5 Whys)</h3>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Penelusuran 5 tingkat sampai akar masalah manajemen/sistem.
          </p>
        </div>
        {WHY_FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-1 block text-xs font-medium text-slate-400">{f.label}</span>
            <textarea
              rows={2}
              value={data[f.key] || ''}
              onChange={(e) => setField(f.key, e.target.value)}
              className="admin-input"
            />
          </label>
        ))}
      </section>

      <section className="space-y-3 border-t border-slate-800 pt-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-400">Root Cause (Akar Masalah Utama)</span>
          <textarea
            rows={3}
            value={data.root_cause || ''}
            onChange={(e) => setField('root_cause', e.target.value)}
            className="admin-input"
            placeholder="Kesimpulan akar masalah sistemik…"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-400">Corrective Action</span>
          <textarea
            rows={3}
            value={data.corrective_action || ''}
            onChange={(e) => setField('corrective_action', e.target.value)}
            className="admin-input"
            placeholder="Tindakan korektif yang disepakati…"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-400">Nama investigator</span>
          <input
            type="text"
            value={data.investigator_name || ''}
            onChange={(e) => setField('investigator_name', e.target.value)}
            className="admin-input"
            placeholder="Nama petugas HSE yang investigasi"
          />
        </label>
      </section>
    </fieldset>
  )
}
