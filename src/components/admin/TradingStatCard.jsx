import { Area, AreaChart, ResponsiveContainer } from 'recharts'

export function Sparkline({ data, up = true, id = 'spark' }) {
  const chartData = (data || []).map((v, i) => ({ i, v }))
  if (!chartData.length) return null
  const stroke = up ? '#34d399' : '#f87171'
  const gradId = String(id).replace(/[^a-zA-Z0-9_-]/g, '-')
  return (
    <div className="h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.4} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={stroke}
            strokeWidth={1.5}
            fill={`url(#${gradId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function TradingStatCard({ label, value, delta, up, sparkData, accent = 'text-slate-100' }) {
  return (
    <div className="admin-stat-card min-w-[148px] shrink-0 rounded-2xl border border-slate-700/60 bg-slate-900/80 p-3.5 backdrop-blur sm:min-w-0">
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className={`font-mono text-2xl font-bold tabular-nums ${accent}`}>{value}</p>
        {delta != null && (
          <span
            className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
              up ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
            }`}
          >
            {up ? '▲' : '▼'} {delta}%
          </span>
        )}
      </div>
      {sparkData?.length > 0 && (
        <div className="mt-2">
          <Sparkline data={sparkData} up={up} id={`spark-${label}`} />
        </div>
      )}
    </div>
  )
}

export function LivePulse() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
    </span>
  )
}
