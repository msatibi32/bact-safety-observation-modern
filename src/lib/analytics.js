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
