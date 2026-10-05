import { useEffect, useMemo, useRef, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import QRCode from 'react-qr-code'
import AdminLayout from '../AdminLayout'
import { canEditObservations } from '../../lib/roles'
import {
  downloadCsv,
  expiringSoon,
  formatJakarta,
  passPhase,
  passUrl,
  phaseLabel,
  remainingLabel,
} from '../../lib/passes'
import { useChartTheme } from '../../lib/theme'
import { useUser } from '../RequireRole'

const PAGE_SIZE = 8
const EMPTY_FACETS = []

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'valid', label: 'On site' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'expiring', label: 'Expiring' },
  { id: 'expired', label: 'Expired' },
  { id: 'rejected', label: 'Rejected' },
]

function dailyCounts(rows, days = 14) {
  const out = []
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date(start)
    day.setDate(start.getDate() - i)
    const next = new Date(day)
    next.setDate(day.getDate() + 1)
    const count = rows.filter((row) => {
      const time = new Date(row.created_at).getTime()
      return time >= day.getTime() && time < next.getTime()
    }).length
    out.push({
      label: day.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      count,
    })
  }
  return out
}

function haystack(row) {
  return [
    row.ref_no,
    row.heading,
    row.sub,
    row.applicant_email,
    row.company,
    row.phone,
    row.area,
    row.purpose,
    row.department,
    row.visitor_name,
    row.applicant_name,
    ...(row.work_types || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function matchesFilter(row, filter) {
  const phase = passPhase(row)
  if (filter === 'pending') return phase === 'pending'
  if (filter === 'valid') return phase === 'valid'
  if (filter === 'scheduled') return phase === 'scheduled'
  if (filter === 'expiring') return expiringSoon(row)
  if (filter === 'expired') return phase === 'expired'
  if (filter === 'rejected') return phase === 'rejected'
  return true
}

export default function RequestDesk({
  eyebrow,
  title,
  description,
  loader,
  approve,
  reject,
  resendApproval,
  renderFacts,
  passKind,
  facets = EMPTY_FACETS,
  exportName = 'bact-requests',
  exportRows,
  tools,
}) {
  const user = useUser()
  const canDecide = canEditObservations(user)
  const chart = useChartTheme()
  const detailRef = useRef(null)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [facetValue, setFacetValue] = useState({})
  const [page, setPage] = useState(1)
  const [copied, setCopied] = useState(false)

  async function load(keepMessage = false) {
    setLoading(true)
    if (!keepMessage) {
      setError('')
      setNote('')
    }
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

  const counts = useMemo(() => {
    return {
      pending: rows.filter((row) => passPhase(row) === 'pending').length,
      valid: rows.filter((row) => passPhase(row) === 'valid').length,
      expiring: rows.filter((row) => expiringSoon(row)).length,
      expired: rows.filter((row) => passPhase(row) === 'expired').length,
    }
  }, [rows])

  const onSite = useMemo(() => rows.filter((row) => passPhase(row) === 'valid'), [rows])
  const chartData = useMemo(() => dailyCounts(rows), [rows])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((row) => {
      if (!matchesFilter(row, filter)) return false
      for (const facet of facets) {
        const selected = facetValue[facet.id] || 'all'
        if (!facet.match(row, selected)) return false
      }
      if (!q) return true
      return haystack(row).includes(q)
    })
  }, [rows, query, filter, facets, facetValue])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const selected = rows.find((row) => row.id === selectedId) || null
  const gradId = `desk-vol-${passKind || 'req'}`

  function chooseFilter(next) {
    setFilter(next)
    setPage(1)
  }

  function selectRow(id) {
    setSelectedId(id)
    setReason('')
    setCopied(false)
    if (window.innerWidth < 1024) {
      window.setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40)
    }
  }

  async function decide(action) {
    if (!selected || !canDecide) return
    setBusy(true)
    setError('')
    setNote('')
    try {
      const result = action === 'approve' ? await approve(selected.id) : await reject(selected.id, reason)
      setReason('')
      await load(true)
      if (result?.email_warning) {
        setError(`Approved, but the email did not arrive: ${result.email_warning}`)
      } else if (action === 'approve') {
        setNote('Approved. The applicant was emailed. The active period is at the bottom of that email.')
      }
    } catch (err) {
      setError(err.message || 'Could not update the request.')
    } finally {
      setBusy(false)
    }
  }

  async function handleResend() {
    if (!selected || !canDecide || !resendApproval) return
    setBusy(true)
    setError('')
    setNote('')
    try {
      await resendApproval(selected.id)
      setNote(`Approval email sent again to ${selected.applicant_email}.`)
    } catch (err) {
      setError(err.message || 'Could not resend the email.')
    } finally {
      setBusy(false)
    }
  }

  function exportFiltered() {
    if (!exportRows || filtered.length === 0) return
    const built = exportRows(filtered)
    const stamp = new Date().toISOString().slice(0, 10)
    downloadCsv(`${exportName}-${stamp}.csv`, built.headers, built.rows)
  }

  function patchRow(id, patch) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  async function copyLink() {
    if (!selected?.public_token || !passKind) return
    const url = passUrl(passKind, selected.public_token)
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setNote(url)
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
        <div className="flex gap-2">
          {exportRows && (
            <button
              type="button"
              onClick={exportFiltered}
              disabled={!filtered.length}
              className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 hover:border-brand-500 disabled:opacity-40"
            >
              Export
            </button>
          )}
          <button
            type="button"
            onClick={() => load()}
            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 hover:border-brand-500"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Pending" value={counts.pending} tone="text-amber-200" active={filter === 'pending'} onClick={() => chooseFilter(filter === 'pending' ? 'all' : 'pending')} />
        <Stat label="Valid now" value={counts.valid} tone="text-emerald-300" active={filter === 'valid'} onClick={() => chooseFilter(filter === 'valid' ? 'all' : 'valid')} />
        <Stat label="Expiring" value={counts.expiring} tone="text-brand-400" active={filter === 'expiring'} onClick={() => chooseFilter(filter === 'expiring' ? 'all' : 'expiring')} />
        <Stat label="Expired" value={counts.expired} active={filter === 'expired'} onClick={() => chooseFilter(filter === 'expired' ? 'all' : 'expired')} />
      </div>

      {counts.expiring > 0 && (
        <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          {counts.expiring} pass{counts.expiring === 1 ? '' : 'es'} end soon. E-Permit is flagged inside 2 hours. Job Permit and visits are flagged inside 24 hours.
        </p>
      )}

      {onSite.length > 0 && (
        <div className="admin-panel mb-4 rounded-2xl border border-emerald-500/30 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-300">On site now · {onSite.length}</p>
            {onSite.length > 6 && (
              <button type="button" onClick={() => chooseFilter('valid')} className="text-[11px] font-medium text-emerald-300">
                Show all
              </button>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {onSite.slice(0, 6).map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => selectRow(row.id)}
                className="rounded-full bg-emerald-500/10 px-3 py-1 text-left text-xs text-emerald-100"
              >
                {row.heading}
                <span className="ml-1.5 text-emerald-300/80">{remainingLabel(row)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="admin-panel mb-4 rounded-2xl border border-slate-800 p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">Requests — 14 days</p>
        <div className="h-28 w-full">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading chart…</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f37021" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#f37021" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={chart.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: chart.tick, fontSize: 10 }} axisLine={false} tickLine={false} interval={1} />
                <YAxis tick={{ fill: chart.tick, fontSize: 10 }} axisLine={false} tickLine={false} width={24} allowDecimals={false} />
                <Tooltip contentStyle={chart.tooltip} labelStyle={chart.tooltipLabel} />
                <Area type="monotone" dataKey="count" name="Requests" stroke="#f37021" strokeWidth={2} fill={`url(#${gradId})`} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {error && <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      {note && <p className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{note}</p>}

      <div className="mb-3 flex flex-col gap-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            placeholder="Search name, company, or reference"
            className="admin-input md:max-w-sm"
          />
          <p className="font-mono text-xs text-slate-500">{filtered.length} shown</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((item) => (
            <FilterChip key={item.id} active={filter === item.id} onClick={() => chooseFilter(item.id)}>
              {item.label}
            </FilterChip>
          ))}
        </div>
        {facets.map((facet) => (
          <div key={facet.id} className="flex flex-wrap gap-1.5">
            {facet.options.map((option) => (
              <FilterChip
                key={option.id}
                active={(facetValue[facet.id] || 'all') === option.id}
                onClick={() => {
                  setFacetValue((prev) => ({ ...prev, [facet.id]: option.id }))
                  setPage(1)
                }}
              >
                {option.label}
              </FilterChip>
            ))}
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="admin-panel overflow-hidden rounded-2xl border border-slate-800">
          {loading ? (
            <p className="p-6 text-sm text-slate-500">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">{rows.length === 0 ? 'No requests yet.' : 'No requests match this filter.'}</p>
          ) : (
            <ul className="divide-y divide-slate-800">
              {paged.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => selectRow(row.id)}
                    className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-800/50 ${
                      selectedId === row.id ? 'bg-slate-800/70' : ''
                    }`}
                  >
                    <span>
                      <span className="block font-mono text-xs text-brand-400">{row.ref_no}</span>
                      <span className="mt-0.5 block text-sm font-medium text-slate-100">{row.heading}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">{row.sub}</span>
                      <span className="mt-0.5 block text-[11px] text-slate-400">{remainingLabel(row)}</span>
                    </span>
                    <PhasePill row={row} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!loading && filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3 text-xs text-slate-400">
              <span>
                {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <span className="flex gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-slate-700 px-2.5 py-1 disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-slate-700 px-2.5 py-1 disabled:opacity-40"
                >
                  Next
                </button>
              </span>
            </div>
          )}
        </div>

        <aside ref={detailRef} className="admin-panel rounded-2xl border border-slate-800 p-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
          {!selected ? (
            <p className="text-sm text-slate-500">Select a request to review.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-mono text-xs text-brand-400">{selected.ref_no}</p>
                  <PhasePill row={selected} />
                </div>
                <h2 className="mt-1 text-base font-semibold text-slate-100">{selected.heading}</h2>
                <p className="text-xs text-slate-500">Submitted {formatJakarta(selected.created_at)}</p>
                <p className="mt-1 text-sm font-medium text-slate-200">{remainingLabel(selected)}</p>
              </div>
              {selected.public_token && passKind && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                  <div className="mx-auto w-fit rounded-xl bg-white p-2">
                    <QRCode value={passUrl(passKind, selected.public_token)} size={132} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <a
                      href={passUrl(passKind, selected.public_token)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-slate-700 px-3 py-2 text-center text-xs font-medium text-slate-200"
                    >
                      Open pass
                    </a>
                    <button type="button" onClick={copyLink} className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200">
                      {copied ? 'Copied' : 'Copy link'}
                    </button>
                  </div>
                </div>
              )}
              {typeof tools === 'function' && <div className="space-y-2">{tools(selected, { patchRow })}</div>}
              <dl className="space-y-2 text-sm">
                <Fact label="Valid from" value={selected.valid_from ? formatJakarta(selected.valid_from) : 'Set on approval'} />
                {renderFacts(selected)}
              </dl>
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
                <div className="space-y-2 border-t border-slate-800 pt-3">
                  <p className="text-xs text-slate-400">
                    {selected.status}
                    {selected.approved_by ? ` · ${selected.approved_by}` : ''}
                    {selected.rejected_reason ? ` — ${selected.rejected_reason}` : ''}
                  </p>
                  {selected.status === 'Approved' && canDecide && resendApproval && (
                    <button type="button" disabled={busy} onClick={handleResend} className="btn-primary w-full">
                      {busy ? 'Sending…' : 'Send approval email again'}
                    </button>
                  )}
                </div>
              )}
              {!canDecide && <p className="text-xs text-amber-300">Viewer mode — approval is limited to HSSE.</p>}
            </div>
          )}
        </aside>
      </div>
    </AdminLayout>
  )
}

function Stat({ label, value, tone = 'text-slate-100', active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`admin-panel rounded-2xl border px-4 py-3 text-left ${active ? 'border-brand-500' : 'border-slate-800'}`}
    >
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${tone}`}>{value}</p>
    </button>
  )
}

function PhasePill({ row }) {
  const phase = passPhase(row)
  const expiring = expiringSoon(row)
  const label = expiring ? 'Expiring' : phaseLabel(phase)
  const tone = expiring
    ? 'bg-brand-500/15 text-brand-400'
    : phase === 'valid'
      ? 'bg-emerald-500/15 text-emerald-300'
      : phase === 'rejected'
        ? 'bg-red-500/15 text-red-300'
        : phase === 'expired'
          ? 'bg-slate-700/80 text-slate-300'
          : phase === 'scheduled'
            ? 'bg-sky-500/15 text-sky-300'
            : 'bg-amber-500/15 text-amber-200'
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${tone}`}>{label}</span>
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
        active ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
      }`}
    >
      {children}
    </button>
  )
}

export function Fact({ label, value }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-slate-200">{value || '—'}</dd>
    </div>
  )
}
