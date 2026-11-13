import { lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { BackendStatusProvider } from '@/hooks/useBackendStatus'
import { ReviewHistoryProvider } from '@/hooks/useReviewHistory'
import { ToastProvider } from '@/hooks/useToast'

const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((module) => ({ default: module.DashboardPage })),
)
const WorkspacePage = lazy(() =>
  import('@/pages/WorkspacePage').then((module) => ({ default: module.WorkspacePage })),
)
const ReviewsPage = lazy(() =>
  import('@/pages/ReviewsPage').then((module) => ({ default: module.ReviewsPage })),
)
const ReviewDetailsPage = lazy(() =>
  import('@/pages/ReviewDetailsPage').then((module) => ({
    default: module.ReviewDetailsPage,
  })),
)
const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })),
)

export default function App() {
  return (
    <BrowserRouter>
      <BackendStatusProvider>
        <ReviewHistoryProvider>
          <ToastProvider>
            <Routes>
              <Route element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="workspace" element={<WorkspacePage />} />
                <Route path="reviews" element={<ReviewsPage />} />
                <Route path="reviews/:owner/:repo/:prNumber" element={<ReviewDetailsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </ToastProvider>
        </ReviewHistoryProvider>
      </BackendStatusProvider>
    </BrowserRouter>
  )
}
