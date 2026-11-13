import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { cn } from '@/utils/cn'

type StatTone = 'default' | 'accent' | 'danger' | 'warning'

const TONES: Record<StatTone, { icon: string; value: string }> = {
  default: { icon: 'border-line-strong bg-white/[0.03] text-slate-400', value: 'text-slate-100' },
  accent: {
    icon: 'border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-300',
    value: 'text-emerald-300',
  },
  danger: {
    icon: 'border-rose-500/20 bg-rose-500/[0.08] text-rose-300',
    value: 'text-rose-300',
  },
  warning: {
    icon: 'border-amber-400/20 bg-amber-400/[0.08] text-amber-300',
    value: 'text-amber-300',
  },
}

interface StatCardProps {
  label: string
  value: string | number
  hint?: string
  icon: LucideIcon
  tone?: StatTone
  className?: string
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'default',
  className,
}: StatCardProps) {
  const styles = TONES[tone]

  return (
    <Card className={cn('relative overflow-hidden p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          {label}
        </p>
        <div
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-lg border',
            styles.icon,
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </div>
      </div>
      <p className={cn('mt-3 text-2xl font-semibold tabular-nums tracking-tight', styles.value)}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-[11px] text-slate-500">{hint}</p> : null}
    </Card>
  )
}
