import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ReviewRecord } from '@/types/api'
import { summarizeSeverities } from '@/utils/severity'

interface ChartPayloadItem {
  name?: string | number
  value?: number | string
  color?: string
  dataKey?: string | number
}

function ActivityTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: ChartPayloadItem[]
  label?: string | number
}) {
  if (!active || !payload?.length) return null

  const total = payload.reduce(
    (sum, item) => sum + (typeof item.value === 'number' ? item.value : 0),
    0,
  )

  return (
    <div className="min-w-[140px] rounded-lg border border-line-strong bg-raised px-3 py-2.5 shadow-panel">
      <p className="text-[11px] font-medium text-slate-300">{label}</p>
      <div className="mt-1.5 space-y-1">
        {payload
          .filter((item) => typeof item.value === 'number' && item.value > 0)
          .map((item) => (
            <div key={String(item.dataKey)} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.name}
              </span>
              <span className="text-[10px] tabular-nums text-slate-200">{item.value}</span>
            </div>
          ))}
      </div>
      <div className="mt-1.5 flex items-center justify-between border-t border-line pt-1.5 text-[10px]">
        <span className="text-slate-500">Total</span>
        <span className="font-medium tabular-nums text-slate-300">{total}</span>
      </div>
    </div>
  )
}

export function ReviewActivityChart({ reviews }: { reviews: ReviewRecord[] }) {
  const data = [...reviews]
    .sort((a, b) => new Date(a.analyzedAt).getTime() - new Date(b.analyzedAt).getTime())
    .slice(-8)
    .map((review) => {
      const summary = summarizeSeverities(review.findings)
      return {
        label: `#${review.prNumber}`,
        critical: summary.critical,
        high: summary.high,
        medium: summary.medium,
        low: summary.low,
        total: summary.total,
      }
    })

  return (
    <div className="h-[230px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }} barSize={18}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1b2622" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            dy={6}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<ActivityTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="critical" name="Critical" stackId="a" fill="#fb7185" radius={[0, 0, 0, 0]} />
          <Bar dataKey="high" name="High" stackId="a" fill="#fb923c" />
          <Bar dataKey="medium" name="Medium" stackId="a" fill="#fbbf24" />
          <Bar dataKey="low" name="Low" stackId="a" fill="#38bdf8" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
