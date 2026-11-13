import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { normalizeSeverity, severityMeta } from '@/utils/severity'
import type { SeverityKey } from '@/types/api'

type BadgeVariant = 'neutral' | 'accent' | 'outline' | 'danger' | 'warning' | 'info'

const VARIANTS: Record<BadgeVariant, string> = {
  neutral: 'border-line-strong bg-white/[0.04] text-slate-300',
  accent: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
  outline: 'border-line-strong text-slate-400',
  danger: 'border-rose-500/25 bg-rose-500/10 text-rose-300',
  warning: 'border-amber-400/25 bg-amber-400/10 text-amber-300',
  info: 'border-sky-400/25 bg-sky-400/10 text-sky-300',
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  children: ReactNode
}

export function Badge({ className, variant = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium leading-5',
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  )
}

interface SeverityBadgeProps {
  severity: string | null | undefined
  size?: 'sm' | 'md'
  className?: string
}

const SEVERITY_SIZE: Record<'sm' | 'md', string> = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-xs',
}

export function SeverityBadge({ severity, size = 'sm', className }: SeverityBadgeProps) {
  const meta = severityMeta(severity)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border font-medium leading-5',
        meta.badgeClass,
        SEVERITY_SIZE[size],
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', meta.dotClass)} aria-hidden="true" />
      {meta.label}
    </span>
  )
}

export function severityFromKey(key: SeverityKey): SeverityKey {
  return normalizeSeverity(key)
}
