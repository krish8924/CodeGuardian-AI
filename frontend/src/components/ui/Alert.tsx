import type { ReactNode } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  OctagonAlert,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/utils/cn'

type AlertVariant = 'info' | 'success' | 'warning' | 'error'

const STYLES: Record<AlertVariant, { wrapper: string; icon: string; Icon: LucideIcon }> = {
  info: {
    wrapper: 'border-sky-500/20 bg-sky-500/[0.05]',
    icon: 'text-sky-400',
    Icon: Info,
  },
  success: {
    wrapper: 'border-emerald-500/20 bg-emerald-500/[0.05]',
    icon: 'text-emerald-400',
    Icon: CheckCircle2,
  },
  warning: {
    wrapper: 'border-amber-400/20 bg-amber-400/[0.05]',
    icon: 'text-amber-400',
    Icon: AlertTriangle,
  },
  error: {
    wrapper: 'border-rose-500/20 bg-rose-500/[0.05]',
    icon: 'text-rose-400',
    Icon: OctagonAlert,
  },
}

interface AlertProps {
  variant?: AlertVariant
  title?: string
  children?: ReactNode
  className?: string
}

export function Alert({ variant = 'info', title, children, className }: AlertProps) {
  const { wrapper, icon, Icon } = STYLES[variant]

  return (
    <div
      className={cn('flex items-start gap-3 rounded-xl border p-4', wrapper, className)}
      role={variant === 'error' ? 'alert' : 'status'}
    >
      <Icon className={cn('mt-0.5 size-4 shrink-0', icon)} aria-hidden="true" />
      <div className="min-w-0 space-y-1">
        {title ? <p className="text-sm font-medium text-slate-100">{title}</p> : null}
        {children ? (
          <div className="text-xs leading-relaxed text-slate-400">{children}</div>
        ) : null}
      </div>
    </div>
  )
}
