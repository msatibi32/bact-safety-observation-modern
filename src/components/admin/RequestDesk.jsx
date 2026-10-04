import { useEffect, useMemo, useState } from 'react'
import AdminLayout from '../AdminLayout'
import { canEditObservations } from '../../lib/roles'
import { formatJakarta } from '../../lib/passes'
import { useUser } from '../RequireRole'

export default function RequestDesk({ eyebrow, title, description, loader, approve, reject, renderFacts }) {
  const user = useUser()
  const canDecide = canEditObservations(user)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await loader()
      setRows(data)
    } catch (err) {
      setError(err.message || 'Could not load requests.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const selected = rows.find((row) => row.id === selectedId) || null
  const counts = useMemo(() => {
    return {
      pending: rows.filter((r) => r.status === 'Pending').length,
      approved: rows.filter((r) => r.status === 'Approved').length,
      rejected: rows.filter((r) => r.status === 'Rejected').length,
    }
  }, [rows])

  async function decide(action) {
    if (!selected || !canDecide) return
    setBusy(true)
    setError('')
    try {
      if (action === 'approve') await approve(selected.id)
      else await reject(selected.id, reason)
      setReason('')
      await load()
    } catch (err) {
      setError(err.message || 'Could not update the request.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminLayout>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-400">{eyebrow}</p>
          <h1 className="mt-1 text-xl font-semibold text-slate-100">{title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">{description}</p>
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 hover:border-brand-500"
        >
          Refresh
        </button>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <Stat label="Pending" value={counts.pending} />
        <Stat label="Approved" value={counts.approved} />
        <Stat label="Rejected" value={counts.rejected} />
      </div>

      {error && <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="admin-panel overflow-hidden rounded-2xl border border-slate-800">
          {loading ? (
            <p className="p-6 text-sm text-slate-500">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">No requests yet.</p>
          ) : (
            <ul className="divide-y divide-slate-800">
              {rows.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(row.id)
                      setReason('')
                    }}
                    className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-800/50 ${
                      selectedId === row.id ? 'bg-slate-800/70' : ''
                    }`}
                  >
                    <span>
                      <span className="block font-mono text-xs text-brand-400">{row.ref_no}</span>
                      <span className="mt-0.5 block text-sm font-medium text-slate-100">{row.heading}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">{row.sub}</span>
                    </span>
                    <StatusPill status={row.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="admin-panel rounded-2xl border border-slate-800 p-4">
          {!selected ? (
            <p className="text-sm text-slate-500">Select a request to review.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="font-mono text-xs text-brand-400">{selected.ref_no}</p>
                <h2 className="mt-1 text-base font-semibold text-slate-100">{selected.heading}</h2>
                <p className="text-xs text-slate-500">{formatJakarta(selected.created_at)}</p>
              </div>
              <dl className="space-y-2 text-sm">{renderFacts(selected)}</dl>
              {selected.status === 'Pending' && canDecide && (
                <div className="space-y-2 border-t border-slate-800 pt-3">
                  <button type="button" disabled={busy} onClick={() => decide('approve')} className="btn-primary w-full">
                    {busy ? 'Saving…' : 'Approve'}
                  </button>
                  <textarea
                    rows={2}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Rejection reason"
                    className="admin-input"
                  />
                  <button
                    type="button"
                    disabled={busy || !reason.trim()}
                    onClick={() => decide('reject')}
                    className="w-full rounded-xl border border-red-500/40 px-4 py-2.5 text-sm font-medium text-red-300 disabled:opacity-40"
                  >
                    Reject
                  </button>
                </div>
              )}
              {selected.status !== 'Pending' && (
                <p className="text-xs text-slate-400">
                  {selected.status}
                  {selected.approved_by ? ` · ${selected.approved_by}` : ''}
                  {selected.rejected_reason ? ` — ${selected.rejected_reason}` : ''}
                </p>
              )}
              {!canDecide && <p className="text-xs text-amber-300">Viewer mode — approval is limited to HSSE.</p>}
            </div>
          )}
        </aside>
      </div>
    </AdminLayout>
  )
}

function Stat({ label, value }) {
  return (
    <div className="admin-panel rounded-2xl border border-slate-800 px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-100">{value}</p>
    </div>
  )
}

function StatusPill({ status }) {
  const tone =
    status === 'Approved'
      ? 'bg-emerald-500/15 text-emerald-300'
      : status === 'Rejected'
        ? 'bg-red-500/15 text-red-300'
        : 'bg-amber-500/15 text-amber-200'
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${tone}`}>{status}</span>
}

export function Fact({ label, value }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-slate-200">{value || '—'}</dd>
    </div>
  )
}
