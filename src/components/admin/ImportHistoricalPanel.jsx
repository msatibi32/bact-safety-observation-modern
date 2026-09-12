import { useState } from 'react'
import { HISTORICAL_COLUMN_MAP, parseHistoricalFile } from '../../lib/importHistorical'
import { canClassifyObservations, isSuperAdmin } from '../../lib/roles'
import { deleteDummySeedObservations, importHistoricalObservations } from '../../lib/store'
import { useUser } from '../RequireRole'

export default function ImportHistoricalPanel({ onImported }) {
  const user = useUser()
  const canImport = canClassifyObservations(user)
  const superAdmin = isSuperAdmin(user)
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  if (!canImport) return null

  async function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    setPreview(null)
    setMessage('')
    setError('')
    if (!file) return
    setBusy('parse')
    try {
      const result = await parseHistoricalFile(file)
      setPreview({ ...result, fileName: file.name })
      if (!result.ready.length && !result.skipped.length) {
        setError('No data rows found. Use the HOC sheet (or a CSV with observation columns).')
      }
    } catch (err) {
      setError(err.message || 'Could not read that file.')
    } finally {
      setBusy('')
    }
  }

  async function handleImport() {
    if (!preview?.ready.length) return
    setBusy('import')
    setError('')
    setMessage('')
    try {
      const result = await importHistoricalObservations(preview.ready.map((r) => r.record))
      setMessage(
        `Imported ${result.inserted} row${result.inserted === 1 ? '' : 's'}. Skipped ${result.skipped} on insert.`,
      )
      setPreview(null)
      onImported?.()
    } catch (err) {
      setError(err.message || 'Import failed.')
    } finally {
      setBusy('')
    }
  }

  async function handleDeleteDummy() {
    if (
      !confirm(
        'Delete only known seed/dummy reports from scripts/seed-dummy-soc.mjs? Real and imported reports stay.',
      )
    ) {
      return
    }
    setBusy('dummy')
    setError('')
    setMessage('')
    try {
      const result = await deleteDummySeedObservations()
      setMessage(
        result.deleted
          ? `Deleted ${result.deleted} dummy/seed report${result.deleted === 1 ? '' : 's'}.`
          : 'No dummy/seed reports found.',
      )
      onImported?.()
    } catch (err) {
      setError(err.message || 'Could not delete dummy reports.')
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="admin-panel mb-5 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
      <p className="text-sm font-semibold text-slate-100">Import historical data</p>
      <p className="mt-1 text-xs text-slate-500">
        Upload the old HSE Excel/CSV (HOC sheet). Preview first, then confirm. Email alerts are not sent.
        Dummy/seed reports are not deleted automatically.
      </p>
      <ul className="mt-2 space-y-0.5 text-[11px] text-slate-600">
        {HISTORICAL_COLUMN_MAP.slice(0, 6).map(([from, to]) => (
          <li key={from}>
            {from} → {to}
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="btn-primary cursor-pointer !py-2 text-sm">
          {busy === 'parse' ? 'Reading…' : 'Choose Excel / CSV'}
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            disabled={Boolean(busy)}
            onChange={handleFile}
          />
        </label>
        {superAdmin && (
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={handleDeleteDummy}
            className="rounded-lg border border-red-500/40 px-3 py-2 text-sm font-medium text-red-300 hover:bg-red-500/10"
          >
            {busy === 'dummy' ? 'Deleting…' : 'Delete dummy / seed reports'}
          </button>
        )}
      </div>

      {preview && (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-slate-400">
            File <span className="text-slate-200">{preview.fileName}</span>
            {preview.sheetName ? ` · sheet ${preview.sheetName}` : ''} · {preview.ready.length} ready ·{' '}
            {preview.skipped.length} skipped
          </p>
          {preview.ready.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Reporter</th>
                    <th className="px-3 py-2">Location</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Finding</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.ready.slice(0, 6).map((row) => (
                    <tr key={row.rowNumber} className="border-t border-slate-800/80">
                      <td className="px-3 py-2 text-slate-300">{row.preview.date}</td>
                      <td className="px-3 py-2 text-slate-200">{row.preview.name}</td>
                      <td className="px-3 py-2 text-slate-400">{row.preview.location}</td>
                      <td className="px-3 py-2 text-slate-400">{row.preview.category}</td>
                      <td className="max-w-xs truncate px-3 py-2 text-slate-500">{row.preview.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {preview.skipped.length > 0 && (
            <p className="text-xs text-amber-300">
              {preview.skipped.length} rows skipped:{' '}
              {preview.skipped
                .slice(0, 4)
                .map((r) => `row ${r.rowNumber} (${r.errors.join(', ')})`)
                .join(' · ')}
              {preview.skipped.length > 4 ? ' …' : ''}
            </p>
          )}
          <button
            type="button"
            disabled={!preview.ready.length || Boolean(busy)}
            onClick={handleImport}
            className="btn-primary !py-2 text-sm"
          >
            {busy === 'import' ? 'Importing…' : `Confirm import (${preview.ready.length})`}
          </button>
        </div>
      )}

      {message && <p className="mt-3 text-sm text-emerald-400">{message}</p>}
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </div>
  )
}
