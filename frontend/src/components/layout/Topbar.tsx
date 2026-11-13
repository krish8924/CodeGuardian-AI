import { Menu, Plus } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BackendStatusPill } from '@/components/layout/BackendStatusPill'
import { Logo } from '@/components/layout/Logo'
import { Button } from '@/components/ui/Button'

const PAGE_LABELS: Record<string, string> = {
  '/': 'Dashboard',
  '/workspace': 'Code Review',
  '/reviews': 'Review History',
}

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const location = useLocation()
  const navigate = useNavigate()

  const pageLabel = location.pathname.startsWith('/reviews/')
    ? 'Review Details'
    : (PAGE_LABELS[location.pathname] ?? 'Not Found')

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-line bg-canvas/85 backdrop-blur-xl">
      <div className="flex h-full items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenMenu}
          className="-ml-1 rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </button>

        <Logo />

        <div className="ml-2 hidden items-center gap-2 border-l border-line pl-4 md:flex">
          <span className="text-[11px] text-slate-600">/</span>
          <span className="text-[11px] font-medium text-slate-400">{pageLabel}</span>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <BackendStatusPill />
          <Button
            size="sm"
            leftIcon={<Plus className="size-3.5" />}
            onClick={() => navigate('/workspace')}
            aria-label="Start a new code review"
          >
            <span className="hidden sm:inline">New review</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
