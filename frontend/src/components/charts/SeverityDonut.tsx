import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { SeveritySummary } from '@/types/api'
import { SEVERITY_ORDER, severityMeta } from '@/utils/severity'
import { cn } from '@/utils/cn'

interface ChartPayloadItem {
  name?: string | number
  value?: number | string
  color?: string
  payload?: { name?: string; color?: string }
}

function DonutTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: ChartPayloadItem[]
}) {
  if (!active || !payload?.length) return null

  const item = payload[0]
  if (!item) return null

  return (
    <div className="rounded-lg border border-line-strong bg-raised px-3 py-2 shadow-panel">
      <p className="text-[11px] text-slate-400">{item.name}</p>
      <p className="text-sm font-semibold tabular-nums text-slate-100">{item.value}</p>
    </div>
  )
}

export function SeverityDonut({
  summary,
  height = 190,
  className,
}: {
  summary: SeveritySummary
  height?: number
  className?: string
}) {
  const data = SEVERITY_ORDER.map((key) => {
    const meta = severityMeta(key)
    return {
      name: meta.label,
      value: summary[key],
      color: meta.chartColor,
      key,
    }
  }).filter((entry) => entry.value > 0)

  const hasData = data.length > 0

  return (
    <div className={className}>
      <div className="relative" style={{ height }}>
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="62%"
                outerRadius="82%"
                paddingAngle={2}
                stroke="none"
                isAnimationActive={false}
              >
                {data.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<DonutTooltip />} cursor={false} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="size-[148px] rounded-full border-[22px] border-line/70" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular-nums text-slate-100">
            {summary.total}
          </span>
          <span className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-slate-500">
            findings
          </span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
        {SEVERITY_ORDER.filter((key) => key !== 'unknown').map((key) => {
          const meta = severityMeta(key)
          const count = summary[key]

          return (
            <div
              key={key}
              className={cn(
                'flex items-center justify-between gap-2 rounded-md px-1 py-0.5',
                count === 0 && 'opacity-45',
              )}
            >
              <span className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className={cn('size-1.5 rounded-full', meta.dotClass)} />
                {meta.label}
              </span>
              <span className="text-[11px] font-medium tabular-nums text-slate-300">
                {count}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
