import { History, LayoutDashboard, ScanSearch, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useReviewHistory } from '@/hooks/useReviewHistory'
import { API_BASE_URL } from '@/services/api'
import { cn } from '@/utils/cn'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/workspace', label: 'Code Review', icon: ScanSearch, end: false },
  { to: '/reviews', label: 'Review History', icon: History, end: false },
] as const

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { reviews } = useReviewHistory()

  return (
    <aside
      className={cn(
        'fixed bottom-0 left-0 top-16 z-40 flex w-64 flex-col border-r border-line bg-panel/80 backdrop-blur-xl transition-transform duration-200 ease-out lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      )}
      aria-label="Primary navigation"
    >
      <div className="flex items-center justify-between px-4 pt-4 lg:hidden">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Navigation
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300"
          aria-label="Close navigation"
        >
          <X className="size-4" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        <p className="hidden px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600 lg:block">
          Workspace
        </p>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-lg border px-3 py-2.5 text-[13px] font-medium transition-colors',
                  isActive
                    ? 'border-emerald-500/15 bg-emerald-500/[0.08] text-emerald-300'
                    : 'border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-slate-200',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      'size-4 shrink-0 transition-colors',
                      isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300',
                    )}
                    aria-hidden="true"
                  />
                  <span className="flex-1">{item.label}</span>
                  {item.to === '/reviews' && reviews.length > 0 ? (
                    <span className="rounded-md border border-line-strong bg-white/[0.04] px-1.5 py-0.5 text-[10px] tabular-nums text-slate-400">
                      {reviews.length}
                    </span>
                  ) : null}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="space-y-3 border-t border-line p-4">
        <div className="rounded-xl border border-line bg-white/[0.02] p-3.5">
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-300">
            <History className="size-3.5 text-emerald-400" aria-hidden="true" />
            Local review history
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
            {reviews.length === 0
              ? 'Completed reviews are stored in this browser.'
              : `${reviews.length} review${reviews.length === 1 ? '' : 's'} stored in this browser.`}
          </p>
          <p className="mt-1.5 text-[10px] leading-relaxed text-slate-600">
            The backend does not expose a history endpoint.
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 px-0.5 text-[10px] text-slate-600">
          <span className="truncate font-mono" title={API_BASE_URL}>
            API {API_BASE_URL}
          </span>
          <span className="shrink-0">v1.0.0</span>
        </div>
      </div>
    </aside>
  )
}
