import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'

const SQL_HINT = 'Jalankan supabase/schema-v19-soc-oct.sql di SQL Editor dulu.'

function emptyData() {
  return { records: [], incidents: [], ready: false, error: '' }
}

function toLocalInput(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 16)
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function toRecord(row) {
  return {
    id: row.id,
    module: row.module,
    title: row.title || '',
    status: row.status || '',
    data: row.data || {},
    created_at: row.created_at,
  }
}

function toIncident(row) {
  return {
    id: row.id,
    name: row.name || '',
    category: row.category || 'Near Miss',
    severity: row.severity || 'Low',
    description: row.description || '',
    lokasi: row.lokasi || '',
    status: row.status || 'Open',
    occurred_at: toLocalInput(row.occurred_at),
    pic: row.pic || '',
    root_cause: row.root_cause || '',
    corrective_action: row.corrective_action || '',
    created_at: row.created_at,
  }
}

function incidentPayload(fields) {
  return {
    name: String(fields.name || '').trim(),
    category: fields.category || null,
    severity: fields.severity || null,
    description: fields.description || null,
    lokasi: fields.lokasi || null,
    status: fields.status || 'Open',
    occurred_at: fields.occurred_at ? new Date(fields.occurred_at).toISOString() : null,
    pic: fields.pic || null,
    root_cause: fields.root_cause || null,
    corrective_action: fields.corrective_action || null,
  }
}

export function useOmniStore() {
  const [data, setData] = useState(emptyData)

  const load = useCallback(async () => {
    const [recordsRes, incidentsRes] = await Promise.all([
      supabase.from('hse_module_records').select('*').order('created_at', { ascending: false }),
      supabase.from('hse_incidents').select('*').order('occurred_at', { ascending: false }),
    ])
    const error = recordsRes.error || incidentsRes.error
    if (error) {
      const missing = /hse_module_records|hse_incidents|schema cache|does not exist/i.test(error.message || '')
      setData({
        records: [],
        incidents: [],
        ready: true,
        error: missing ? SQL_HINT : error.message,
      })
      return
    }
    setData({
      records: (recordsRes.data || []).map(toRecord),
      incidents: (incidentsRes.data || []).map(toIncident),
      ready: true,
      error: '',
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    load().catch((err) => {
      if (!cancelled) {
        setData({ records: [], incidents: [], ready: true, error: err.message || SQL_HINT })
      }
    })
    return () => {
      cancelled = true
    }
  }, [load])

  const recordsFor = useCallback(
    (moduleKey) => data.records.filter((row) => row.module === moduleKey),
    [data.records],
  )

  async function saveRecord(moduleKey, recordId, fields, title, status) {
    const payload = { title, status: status || '', data: fields }
    const query = recordId
      ? supabase.from('hse_module_records').update(payload).eq('id', recordId)
      : supabase.from('hse_module_records').insert({ ...payload, module: moduleKey })
    const { error } = await query
    if (error) {
      setData((prev) => ({ ...prev, error: error.message }))
      return false
    }
    await load()
    return true
  }

  async function deleteRecord(recordId) {
    const { error } = await supabase.from('hse_module_records').delete().eq('id', recordId)
    if (error) {
      setData((prev) => ({ ...prev, error: error.message }))
      return false
    }
    await load()
    return true
  }

  async function saveIncident(incidentId, fields) {
    const payload = incidentPayload(fields)
    const query = incidentId
      ? supabase.from('hse_incidents').update(payload).eq('id', incidentId)
      : supabase.from('hse_incidents').insert(payload)
    const { error } = await query
    if (error) {
      setData((prev) => ({ ...prev, error: error.message }))
      return false
    }
    await load()
    return true
  }

  async function deleteIncident(incidentId) {
    const { error } = await supabase.from('hse_incidents').delete().eq('id', incidentId)
    if (error) {
      setData((prev) => ({ ...prev, error: error.message }))
      return false
    }
    await load()
    return true
  }

  return {
    records: data.records,
    incidents: data.incidents,
    ready: data.ready,
    error: data.error,
    recordsFor,
    saveRecord,
    deleteRecord,
    saveIncident,
    deleteIncident,
  }
}

export function activeEmployees(records) {
  return records
    .filter((row) => row.module === 'employee' && row.data?.status !== 'Non-aktif')
    .sort((a, b) => String(a.data?.nama || '').localeCompare(String(b.data?.nama || '')))
}

export function employeeNames(records, value) {
  const ids = String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  const byId = new Map(records.filter((row) => row.module === 'employee').map((row) => [String(row.id), row]))
  return ids.map((id) => byId.get(id)?.data?.nama).filter(Boolean)
}
