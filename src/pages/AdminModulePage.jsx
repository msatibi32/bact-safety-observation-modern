import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import { columnFields, MODULE_SCHEMAS, moduleStats, titleField } from '../lib/omniCatalog'
import { activeEmployees, employeeNames, useOmniStore } from '../lib/omniStore'
import { canEditObservations } from '../lib/roles'
import { useUser } from '../components/RequireRole'

function blankForm(schema) {
  const next = {}
  schema.fields.forEach((field) => {
    next[field.key] = ''
  })
  return next
}

function riskFromHiradc(fields) {
  const likelihood = parseInt(fields.likelihood, 10) || 0
  const severity = parseInt(fields.severity_n, 10) || 0
  const score = likelihood * severity
  const risk = score > 15 ? 'Extreme' : score >= 8 ? 'High' : score >= 4 ? 'Medium' : score ? 'Low' : ''
  return { ...fields, score, risk_level: risk }
}

function badgeClass(status) {
  const value = String(status || '').toLowerCase()
  if (['closed', 'aktif', 'active', 'compliant', 'qualified', 'baik'].includes(value)) {
    return 'bg-emerald-500/15 text-emerald-300'
  }
  if (['expired', 'non-compliant', 'blacklisted', 'rusak', 'critical', 'rejected', 'tidak aktif'].includes(value)) {
    return 'bg-red-500/15 text-red-300'
  }
  if (['near expiry', 'warning', 'in progress', 'probation', 'medium', 'high', 'perlu perbaikan'].includes(value)) {
    return 'bg-amber-500/15 text-amber-200'
  }
  return 'bg-slate-800 text-slate-300'
}

export default function AdminModulePage() {
  const { moduleKey } = useParams()
  const schema = MODULE_SCHEMAS[moduleKey]
  const user = useUser()
  const canEdit = canEditObservations(user)
  const store = useOmniStore()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(null)
  const [viewing, setViewing] = useState(null)

  const rows = store.recordsFor(schema ? moduleKey : '')
  const employees = activeEmployees(store.records)
  const columns = schema ? columnFields(schema) : []
  const stats = schema ? moduleStats(moduleKey, rows) : []

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q || !schema) return rows
    return rows.filter((row) => {
      const hay = [row.title, ...schema.fields.map((field) => row.data?.[field.key])]
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [query, rows, schema])

  const pageSize = 10
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, pages)
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  if (!schema) {
    return (
      <AdminLayout>
        <p className="text-sm text-slate-400">Menu ini tidak ada.</p>
      </AdminLayout>
    )
  }

  function openCreate() {
    setEditing(null)
    setForm(blankForm(schema))
  }

  function openEdit(row) {
    setEditing(row.id)
    setForm({ ...blankForm(schema), ...row.data })
  }

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function toggleEmployee(field, id) {
    const current = String(form?.[field.key] || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
    const next = current.includes(String(id))
      ? current.filter((item) => item !== String(id))
      : [...current, String(id)]
    const patch = { [field.key]: next.join(',') }
    if (field.syncCountField) patch[field.syncCountField] = String(next.length)
    setForm((prev) => ({ ...prev, ...patch }))
  }

  async function handleSave(event) {
    event.preventDefault()
    const required = schema.fields.find((field) => field.required && !String(form[field.key] || '').trim())
    if (required) return
    let payload = { ...form }
    if (moduleKey === 'hiradc') payload = riskFromHiradc(payload)
    const title = String(payload[titleField(schema).key] || '').trim() || 'Tanpa judul'
    const ok = await store.saveRecord(moduleKey, editing, payload, title, payload.status || '')
    if (ok) setForm(null)
  }

  async function handleDelete(row) {
    if (!window.confirm(`Hapus "${row.title}"?`)) return
    const ok = await store.deleteRecord(row.id)
    if (ok && viewing?.id === row.id) setViewing(null)
  }

  return (
    <AdminLayout>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">{schema.label}</h1>
          <p className={`text-xs ${store.error ? 'text-amber-300' : 'text-slate-500'}`}>
            {store.error || `${rows.length} catatan. Tersimpan di database.`}
          </p>
        </div>
        {canEdit && (
          <button type="button" onClick={openCreate} className="btn-primary px-4 py-2 text-sm">
            Tambah
          </button>
        )}
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="admin-panel rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs text-slate-500">{item.label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-100">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="admin-panel rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setPage(1)
          }}
          placeholder="Cari catatan..."
          className="admin-input mb-3 max-w-sm"
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                {columns.map((field) => (
                  <th key={field.key} className="px-2 py-2 font-medium">
                    {field.label}
                  </th>
                ))}
                {moduleKey === 'hiradc' && <th className="px-2 py-2 font-medium">Skor</th>}
                <th className="px-2 py-2 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 2} className="px-2 py-8 text-center text-slate-500">
                    Belum ada data. Klik Tambah untuk mencatat.
                  </td>
                </tr>
              )}
              {visible.map((row) => (
                <tr key={row.id} className="border-t border-slate-800">
                  {columns.map((field) => (
                    <td key={field.key} className="px-2 py-2.5 text-slate-200">
                      {field.badge && row.data?.[field.key] ? (
                        <span className={`rounded-full px-2 py-0.5 text-xs ${badgeClass(row.data[field.key])}`}>
                          {row.data[field.key]}
                        </span>
                      ) : (
                        <span className="line-clamp-2">{displayValue(store.records, field, row.data?.[field.key])}</span>
                      )}
                    </td>
                  ))}
                  {moduleKey === 'hiradc' && (
                    <td className="px-2 py-2.5 text-slate-300">
                      {row.data?.score ? `${row.data.score} · ${row.data.risk_level}` : '—'}
                    </td>
                  )}
                  <td className="px-2 py-2.5">
                    <div className="flex gap-2 text-xs">
                      <button type="button" onClick={() => setViewing(row)} className="text-brand-400">
                        Lihat
                      </button>
                      {canEdit && (
                        <>
                          <button type="button" onClick={() => openEdit(row)} className="text-slate-300">
                            Edit
                          </button>
                          <button type="button" onClick={() => handleDelete(row)} className="text-red-400">
                            Hapus
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="mt-3 flex items-center justify-end gap-2 text-xs text-slate-400">
            <button type="button" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} className="rounded-lg border border-slate-700 px-2 py-1 disabled:opacity-40">
              Sebelumnya
            </button>
            <span>
              {safePage} / {pages}
            </span>
            <button type="button" disabled={safePage >= pages} onClick={() => setPage(safePage + 1)} className="rounded-lg border border-slate-700 px-2 py-1 disabled:opacity-40">
              Berikutnya
            </button>
          </div>
        )}
      </div>

      {form && (
        <FormModal
          schema={schema}
          form={form}
          employees={employees}
          title={editing ? `Edit ${schema.label}` : `Tambah ${schema.label}`}
          onChange={updateField}
          onToggleEmployee={toggleEmployee}
          onClose={() => setForm(null)}
          onSubmit={handleSave}
        />
      )}

      {viewing && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div className="admin-panel max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 className="font-semibold text-slate-100">{viewing.title}</h2>
              <button type="button" onClick={() => setViewing(null)} className="text-slate-400">
                Tutup
              </button>
            </div>
            <dl className="space-y-2 text-sm">
              {schema.fields.map((field) => (
                <div key={field.key}>
                  <dt className="text-xs text-slate-500">{field.label}</dt>
                  <dd className="text-slate-200">{displayValue(store.records, field, viewing.data?.[field.key]) || '—'}</dd>
                </div>
              ))}
              {moduleKey === 'hiradc' && viewing.data?.score ? (
                <div>
                  <dt className="text-xs text-slate-500">Skor risiko</dt>
                  <dd className="text-slate-200">
                    {viewing.data.score} · {viewing.data.risk_level}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

function displayValue(records, field, value) {
  if (field.type === 'employee_multi') {
    const names = employeeNames(records, value)
    return names.length ? names.join(', ') : '—'
  }
  return value || '—'
}

function FormModal({ schema, form, employees, title, onChange, onToggleEmployee, onClose, onSubmit }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <form onSubmit={onSubmit} className="admin-panel max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-100">{title}</h2>
          <button type="button" onClick={onClose} className="text-sm text-slate-400">
            Tutup
          </button>
        </div>
        <div className="space-y-3">
          {schema.fields.map((field) => (
            <label key={field.key} className="block text-sm">
              <span className="mb-1 block text-xs text-slate-400">
                {field.label}
                {field.required ? ' *' : ''}
              </span>
              <FieldControl
                field={field}
                value={form[field.key] || ''}
                employees={employees}
                onChange={(value) => onChange(field.key, value)}
                onToggleEmployee={(id) => onToggleEmployee(field, id)}
              />
            </label>
          ))}
        </div>
        <button type="submit" className="btn-primary mt-4 w-full">
          Simpan
        </button>
      </form>
    </div>
  )
}

function FieldControl({ field, value, employees, onChange, onToggleEmployee }) {
  const [customCategory, setCustomCategory] = useState(
    () => field.type === 'select_other' && Boolean(value) && !field.options.includes(value),
  )
  if (field.type === 'textarea') {
    return <textarea rows={3} value={value} onChange={(event) => onChange(event.target.value)} className="admin-input" placeholder={field.ph || ''} />
  }
  if (field.type === 'select' || field.type === 'select_other') {
    const inList = field.options.includes(value)
    return (
      <div className="space-y-2">
        <select
          value={customCategory ? '__other__' : inList ? value : ''}
          onChange={(event) => {
            if (event.target.value === '__other__') {
              setCustomCategory(true)
              onChange('')
              return
            }
            setCustomCategory(false)
            onChange(event.target.value)
          }}
          className="admin-input"
        >
          <option value="">— Pilih —</option>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
          {field.type === 'select_other' && <option value="__other__">Lainnya, tulis sendiri</option>}
        </select>
        {customCategory && (
          <input value={value} onChange={(event) => onChange(event.target.value)} className="admin-input" placeholder="Tulis kategori" />
        )}
      </div>
    )
  }
  if (field.type === 'employee_multi') {
    const selected = String(value)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
    if (!employees.length) {
      return <p className="text-xs text-amber-300">Isi menu Employee dulu, lalu centang nama di sini.</p>
    }
    return (
      <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-slate-700 p-2">
        {employees.map((person) => (
          <label key={person.id} className="flex items-center gap-2 text-xs text-slate-200">
            <input
              type="checkbox"
              checked={selected.includes(String(person.id))}
              onChange={() => onToggleEmployee(person.id)}
            />
            {person.data?.nama} · {person.data?.jabatan || '—'}
          </label>
        ))}
      </div>
    )
  }
  return (
    <input
      type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
      value={value}
      required={field.required}
      onChange={(event) => onChange(event.target.value)}
      className="admin-input"
      placeholder={field.ph || ''}
    />
  )
}
