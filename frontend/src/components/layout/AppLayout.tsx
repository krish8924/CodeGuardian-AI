import { Suspense, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { LoadingBlock } from '@/components/ui/Spinner'

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-canvas">
      <Topbar onOpenMenu={() => setMobileOpen(true)} />

      <Sidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 top-16 z-30 bg-black/60 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation overlay"
        />
      ) : null}

      <main className="min-h-screen pt-16 lg:pl-64">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <Suspense fallback={<LoadingBlock label="Loading workspace…" className="min-h-[50vh]" />}>
            <Outlet />
          </Suspense>
        </div>
        <footer className="mx-auto flex w-full max-w-[1440px] flex-col gap-1 border-t border-line/60 px-4 py-5 text-[10px] text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>CodeGuardian AI · AI-powered pull request security review</span>
          <span>Scanner findings are advisory. Verify fixes before merging.</span>
        </footer>
      </main>
    </div>
  )
}
