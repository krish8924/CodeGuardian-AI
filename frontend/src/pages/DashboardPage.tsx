import { Activity, ArrowRight, FileSearch, GitPullRequest, ShieldAlert } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ReviewActivityChart } from '@/components/charts/ReviewActivityChart'
import { BackendStatusCard } from '@/components/dashboard/BackendStatusCard'
import { QuickStartCard } from '@/components/dashboard/QuickStartCard'
import { RecentReviews } from '@/components/dashboard/RecentReviews'
import { ScannerCoverage } from '@/components/dashboard/ScannerCoverage'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useReviewHistory } from '@/hooks/useReviewHistory'
import { formatNumber } from '@/utils/format'
import { SEVERITY_ORDER, severityMeta, summarizeSeverities } from '@/utils/severity'

export function DashboardPage() {
  useDocumentTitle('Dashboard')

  const navigate = useNavigate()
  const { reviews, storageError } = useReviewHistory()

  const allFindings = reviews.flatMap((review) => review.findings)
  const summary = summarizeSeverities(allFindings)
  const highAndCritical = summary.critical + summary.high
  const filesInspected = reviews.reduce((total, review) => total + review.files.length, 0)
  const repositories = new Set(reviews.map((review) => `${review.owner}/${review.repo}`)).size

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Overview"
        title="Security dashboard"
        description="Review activity, scanner coverage and backend health for the CodeGuardian AI pipeline."
        actions={
          <Button
            leftIcon={<GitPullRequest className="size-4" />}
            rightIcon={<ArrowRight className="size-3.5" />}
            onClick={() => navigate('/workspace')}
          >
            New review
          </Button>
        }
      />

      <p className="text-[11px] text-slate-600">
        Dashboard metrics are derived from reviews saved in this browser. The backend does not
        expose aggregate statistics or review history endpoints.
      </p>

      {storageError ? <Alert variant="warning" title="Local history unavailable">{storageError}</Alert> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Reviews analyzed"
          value={formatNumber(reviews.length)}
          hint={
            reviews.length > 0
              ? `Across ${repositories} ${repositories === 1 ? 'repository' : 'repositories'}`
              : 'No reviews stored yet'
          }
          icon={Activity}
        />
        <StatCard
          label="Findings detected"
          value={formatNumber(summary.total)}
          hint="Across stored reviews"
          icon={FileSearch}
          tone="accent"
        />
        <StatCard
          label="High & critical"
          value={formatNumber(highAndCritical)}
          hint={highAndCritical > 0 ? 'Prioritise these findings' : 'No urgent findings stored'}
          icon={ShieldAlert}
          tone={highAndCritical > 0 ? 'danger' : 'default'}
        />
        <StatCard
          label="Files inspected"
          value={formatNumber(filesInspected)}
          hint="Changed files across stored reviews"
          icon={GitPullRequest}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Review activity</CardTitle>
              <CardDescription>
                {reviews.length === 0
                  ? 'Run a review to plot severity trends from real scanner results.'
                  : `Severity mix for the last ${Math.min(reviews.length, 8)} stored review${reviews.length === 1 ? '' : 's'}.`}
              </CardDescription>
            </div>
            <div className="hidden items-center gap-3 sm:flex">
              {SEVERITY_ORDER.filter((key) => key !== 'unknown' && key !== 'info').map((key) => {
                const meta = severityMeta(key)
                return (
                  <span key={key} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <span className={`size-1.5 rounded-full ${meta.dotClass}`} />
                    {meta.label}
                  </span>
                )
              })}
            </div>
          </CardHeader>
          <CardBody className="pt-3">
            {reviews.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="No activity to chart"
                description="Run your first review to populate severity and activity charts with real scanner results."
                action={
                  <Button size="sm" onClick={() => navigate('/workspace')}>
                    Run a review
                  </Button>
                }
                className="border-0 bg-transparent py-8"
              />
            ) : (
              <ReviewActivityChart reviews={reviews} />
            )}
          </CardBody>
        </Card>

        <BackendStatusCard />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RecentReviews reviews={reviews} />
        </div>
        <QuickStartCard />
      </div>

      <ScannerCoverage findings={allFindings} />
    </div>
  )
}
