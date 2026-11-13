import { ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={cn(
        'group inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60',
        className,
      )}
      aria-label="CodeGuardian AI home"
    >
      <span className="relative flex size-8 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/10 text-emerald-300 transition-colors group-hover:bg-emerald-500/15">
        <ShieldCheck className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
      </span>
      <span className="flex items-baseline gap-1.5">
        <span className="text-[15px] font-semibold tracking-tight text-slate-100">
          CodeGuardian
        </span>
        <span className="rounded border border-emerald-500/20 bg-emerald-500/[0.08] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
          AI
        </span>
      </span>
    </Link>
  )
}
