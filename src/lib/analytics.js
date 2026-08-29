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
