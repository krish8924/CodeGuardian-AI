import { RefreshCw } from 'lucide-react'
import { useBackendStatus } from '@/hooks/useBackendStatus'
import { cn } from '@/utils/cn'

export function BackendStatusPill({ compact = false }: { compact?: boolean }) {
  const { health, healthError, refresh, lastChecked } = useBackendStatus()

  const label =
    health === 'online' ? 'API online' : health === 'offline' ? 'API offline' : 'Checking API'

  const dotClass =
    health === 'online'
      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
      : health === 'offline'
        ? 'bg-rose-400'
        : 'bg-amber-300 animate-pulse'

  const wrapperClass =
    health === 'online'
      ? 'border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-300'
      : health === 'offline'
        ? 'border-rose-500/20 bg-rose-500/[0.06] text-rose-300'
        : 'border-amber-400/20 bg-amber-400/[0.06] text-amber-300'

  const title =
    health === 'offline'
      ? healthError ?? 'The backend is unreachable.'
      : lastChecked
        ? `Last checked ${lastChecked.toLocaleTimeString()}`
        : 'Checking backend connection'

  return (
    <button
      type="button"
      onClick={() => void refresh()}
      title={`${title} Click to re-check.`}
      className={cn(
        'group inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
        wrapperClass,
      )}
    >
      <span className={cn('size-1.5 rounded-full', dotClass)} aria-hidden="true" />
      {!compact ? <span className="hidden sm:inline">{label}</span> : null}
      <RefreshCw className="size-3 opacity-40 transition-opacity group-hover:opacity-100" />
      <span className="sr-only">{label}. Click to refresh.</span>
    </button>
  )
}
