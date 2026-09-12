// Helpers untuk chart & KPI trend di dashboard admin.

export function lastNDays(n = 14) {
  const days = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    days.push(d)
  }
  return days
}

export function dailyReportCounts(observations, days = 14) {
  return lastNDays(days).map((day) => {
    const key = day.toISOString().slice(0, 10)
    const count = observations.filter((o) => {
      const created = new Date(o.created_at || o.tanggal_waktu).toISOString().slice(0, 10)
      return created === key
    }).length
    return {
      date: key,
      label: day.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      count,
      hipo: observations.filter((o) => {
        const created = new Date(o.created_at || o.tanggal_waktu).toISOString().slice(0, 10)
        return created === key && o.is_hipo
      }).length,
    }
  })
}

function toLocalDayKey(value) {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function enumerateLocalDays(from, to) {
  const start = from instanceof Date ? new Date(from) : new Date(`${from}T00:00:00`)
  const end = to instanceof Date ? new Date(to) : new Date(`${to}T00:00:00`)
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return []
  const lo = start <= end ? start : end
  const hi = start <= end ? end : start
  const days = []
  for (let d = new Date(lo); d <= hi; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d))
  }
  return days
}

/** Daily SOC + HiPo counts on local calendar days (observation date, then created_at). */
export function dailyCountsBetween(observations, from, to) {
  const list = observations || []
  return enumerateLocalDays(from, to).map((day) => {
    const key = toLocalDayKey(day)
    let count = 0
    let hipo = 0
    for (const o of list) {
      const raw = o.tanggal_waktu || o.created_at
      if (!raw || toLocalDayKey(raw) !== key) continue
      count++
      if (o.is_hipo) hipo++
    }
    return {
      date: key,
      label: day.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      count,
      hipo,
    }
  })
}

/** Last 7 local days including today. */
export function weeklyVolumeCounts(observations) {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 6)
  return dailyCountsBetween(observations, from, to)
}

/** Daily volume from the 1st of this month through today. */
export function monthlyVolumeCounts(observations) {
  const now = new Date()
  return dailyCountsBetween(observations, new Date(now.getFullYear(), now.getMonth(), 1), now)
}

export function periodCount(observations, daysAgoStart, daysAgoEnd = 0) {
  const now = new Date()
  now.setHours(23, 59, 59, 999)
  const end = new Date(now)
  end.setDate(end.getDate() - daysAgoEnd)
  const start = new Date(now)
  start.setDate(start.getDate() - daysAgoStart)
  start.setHours(0, 0, 0, 0)

  return observations.filter((o) => {
    const t = new Date(o.created_at || o.tanggal_waktu)
    return t >= start && t <= end
  }).length
}

export function trendDelta(observations) {
  const thisWeek = periodCount(observations, 7, 0)
  const lastWeek = periodCount(observations, 14, 7)
  if (lastWeek === 0) return { pct: thisWeek > 0 ? 100 : 0, up: thisWeek >= lastWeek }
  const pct = Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
  return { pct: Math.abs(pct), up: pct >= 0 }
}

export function sparklineValues(observations, days = 7) {
  return dailyReportCounts(observations, days).map((d) => d.count)
}

export function contractorScorecard(observations) {
  const companies = {}
  for (const o of observations) {
    const name = o.nama_perusahaan || '—'
    if (!companies[name]) companies[name] = { name, total: 0, hipo: 0, open: 0, positive: 0 }
    companies[name].total++
    if (o.is_hipo) companies[name].hipo++
    if (o.status !== 'Closed' && o.status !== 'Rejected') companies[name].open++
    if (o.kategori === 'Positive Observation') companies[name].positive++
  }
  return Object.values(companies).sort((a, b) => b.total - a.total)
}

export function overdueEscalations(observations) {
  const now = Date.now()
  return observations.filter(
    (o) =>
      o.is_hipo &&
      o.status !== 'Closed' &&
      o.status !== 'Rejected' &&
      o.escalation_due_at &&
      new Date(o.escalation_due_at).getTime() < now,
  )
}

export function monthlyReportCount(observations) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  return observations.filter((o) => new Date(o.created_at || o.tanggal_waktu) >= start).length
}

export function departmentStats(observations) {
  const map = {}
  for (const o of observations) {
    const name = o.departemen || '—'
    if (!map[name]) map[name] = { name, total: 0, open: 0, closed: 0 }
    map[name].total++
    if (o.status === 'Closed') map[name].closed++
    else if (o.status !== 'Rejected') map[name].open++
  }
  return Object.values(map).sort((a, b) => b.total - a.total)
}

export function topLocations(observations, limit = 8) {
  const counts = {}
  for (const o of observations) {
    const loc = (o.lokasi_teks || '—').trim()
    counts[loc] = (counts[loc] || 0) + 1
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, value]) => ({ name, value }))
}

export function monthlyTrend(observations) {
  const months = {}
  for (const o of observations) {
    const d = new Date(o.created_at || o.tanggal_waktu)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
    if (!months[key]) months[key] = { key, label, count: 0, investigation: 0 }
    months[key].count++
    if (o.requires_investigation || o.investigation_data || o.root_cause) {
      months[key].investigation++
    }
  }
  return Object.values(months).sort((a, b) => a.key.localeCompare(b.key))
}

export function investigationCount(observations) {
  return observations.filter(
    (o) => o.requires_investigation || o.investigation_data || (o.root_cause && o.root_cause.length > 10),
  ).length
}

function dayKey(value) {
  return new Date(value).toISOString().slice(0, 10)
}

function logHaystack(log) {
  return `${log.action || ''} ${log.details || ''}`.toLowerCase()
}

export function isStaffActor(email) {
  return Boolean(email && String(email).includes('@'))
}

/** Klasifikasi jejak HSE: investigasi vs pekerjaan ringan (klasifikasi / close tanpa investigasi). */
export function classifyHseLog(log) {
  const text = logHaystack(log)
  const investigation =
    text.includes('investigasi') ||
    text.includes('5 why') ||
    text.includes('5w1h') ||
    text.includes('root cause') ||
    text.includes('akar masalah')
  const closed =
    text.includes('→ closed') ||
    text.includes('status: closed') ||
    (text.includes('closed') && (text.includes('status') || text.includes('ditutup')))
  const classify =
    text.includes('kategori') ||
    text.includes('risiko') ||
    text.includes('klasifikasi') ||
    text.includes('tingkat_risiko')
  const followUp =
    text.includes('follow') ||
    text.includes('tindak') ||
    text.includes('capa') ||
    /\bpic\b/.test(text)
  return {
    investigation,
    closed,
    classify,
    light: !investigation && (closed || classify || followUp),
  }
}

export function hseDailyCompletion(logs, days = 14) {
  const staffLogs = (logs || []).filter((log) => isStaffActor(log.actor_email))
  return lastNDays(days).map((day) => {
    const key = day.toISOString().slice(0, 10)
    const dayLogs = staffLogs.filter((log) => dayKey(log.created_at) === key)
    let investigasi = 0
    let ringan = 0
    for (const log of dayLogs) {
      const kind = classifyHseLog(log)
      if (kind.investigation) investigasi++
      else if (kind.light) ringan++
    }
    return {
      date: key,
      label: day.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      aksi: dayLogs.length,
      investigasi,
      ringan,
    }
  })
}

export function hseOfficerTracking(logs, days = 14) {
  const map = {}
  for (const log of logs || []) {
    const email = log.actor_email || ''
    if (!isStaffActor(email)) continue
    if (!map[email]) {
      map[email] = {
        email,
        name: email.split('@')[0],
        aksi: 0,
        investigasi: 0,
        ringan: 0,
        klasifikasi: 0,
        closed: 0,
        obsIds: new Set(),
        days: {},
      }
    }
    const row = map[email]
    row.aksi++
    if (log.observation_id) row.obsIds.add(log.observation_id)
    const kind = classifyHseLog(log)
    if (kind.investigation) row.investigasi++
    if (kind.closed) row.closed++
    if (kind.classify) row.klasifikasi++
    if (kind.light) row.ringan++
    const key = dayKey(log.created_at)
    row.days[key] = (row.days[key] || 0) + 1
  }

  return Object.values(map)
    .map((row) => ({
      email: row.email,
      name: row.name,
      aksi: row.aksi,
      investigasi: row.investigasi,
      ringan: row.ringan,
      klasifikasi: row.klasifikasi,
      closed: row.closed,
      touched: row.obsIds.size,
      spark: lastNDays(days).map((day) => row.days[day.toISOString().slice(0, 10)] || 0),
    }))
    .sort((a, b) => b.aksi - a.aksi || b.investigasi - a.investigasi)
}

export function hseActionTrend(daily) {
  const last = (daily || []).slice(-7).reduce((sum, day) => sum + day.aksi, 0)
  const prev = (daily || []).slice(-14, -7).reduce((sum, day) => sum + day.aksi, 0)
  if (prev === 0) return { pct: last > 0 ? 100 : 0, up: last >= prev }
  const pct = Math.round(((last - prev) / prev) * 100)
  return { pct: Math.abs(pct), up: pct >= 0 }
}

/** Performa aktor HSE dari audit logs — Super Admin only. */
export function hsePerformanceFromAudits(observations, auditLogs) {
  const byActor = {}
  for (const log of auditLogs || []) {
    const email = log.actor_email || '—'
    if (!byActor[email]) {
      byActor[email] = { email, changes: 0, investigations: 0, closed: 0, obsIds: new Set() }
    }
    byActor[email].changes++
    if (log.observation_id) byActor[email].obsIds.add(log.observation_id)
    const details = (log.details || '').toLowerCase()
    const action = (log.action || '').toLowerCase()
    if (details.includes('investigasi') || action.includes('investigasi')) {
      byActor[email].investigations++
    }
    if (details.includes('→ closed') || details.includes('status: ') && details.includes('closed')) {
      byActor[email].closed++
    }
  }
  return Object.values(byActor)
    .map((a) => ({
      email: a.email,
      changes: a.changes,
      touchedReports: a.obsIds.size,
      investigations: a.investigations,
      closed: a.closed,
    }))
    .sort((a, b) => b.changes - a.changes)
}
