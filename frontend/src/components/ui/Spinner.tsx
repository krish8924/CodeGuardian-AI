import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('size-4 animate-spin text-emerald-400', className)} aria-hidden="true" />
}

export function LoadingBlock({ label = 'Loading…', className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-2.5 py-12 text-sm text-slate-400', className)}>
      <Loader2 className="size-4 animate-spin text-emerald-400" aria-hidden="true" />
      {label}
    </div>
  )
}
