import { ChevronDown } from 'lucide-react'
import type { SelectHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(
          'h-9 w-full appearance-none rounded-lg border border-line bg-canvas/80 pl-3 pr-8 text-xs text-slate-300 outline-none transition-colors',
          'focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-500"
        aria-hidden="true"
      />
    </div>
  )
}
