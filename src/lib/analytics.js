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
