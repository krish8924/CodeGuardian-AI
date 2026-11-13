import { ArrowUpRight, GitPullRequest, ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import type { ReviewRecord } from '@/types/api'
import { formatRelativeTime, truncate } from '@/utils/format'
import { reviewPath } from '@/utils/github'
import { severityMeta, summarizeSeverities } from '@/utils/severity'
import { cn } from '@/utils/cn'

export function RecentReviews({ reviews }: { reviews: ReviewRecord[] }) {
  const recent = reviews.slice(0, 5)

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div>
          <CardTitle>Recent reviews</CardTitle>
          <CardDescription>Latest analyses stored in this browser.</CardDescription>
        </div>
        <Link
          to="/reviews"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
        >
          View all
          <ArrowUpRight className="size-3" />
        </Link>
      </CardHeader>
      <CardBody className="flex-1 pt-3">
        {recent.length === 0 ? (
          <EmptyState
            icon={GitPullRequest}
            title="No reviews yet"
            description="Run a security review on a GitHub pull request to see findings and activity here."
            action={
              <Link to="/workspace">
                <Button size="sm">Start a review</Button>
              </Link>
            }
          />
        ) : (
          <div className="divide-y divide-line/70">
            {recent.map((review) => {
              const summary = summarizeSeverities(review.findings)
              const serious = summary.critical + summary.high
              const topSeverity =
                summary.critical > 0
                  ? 'critical'
                  : summary.high > 0
                    ? 'high'
                    : summary.medium > 0
                      ? 'medium'
                      : summary.low > 0
                        ? 'low'
                        : 'info'
              const meta = severityMeta(topSeverity)

              return (
                <Link
                  key={review.id}
                  to={reviewPath(review.owner, review.repo, review.prNumber)}
                  className="group flex items-center gap-3 py-3.5 transition-colors first:pt-0 last:pb-0"
                >
                  <span
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-lg border',
                      serious > 0
                        ? 'border-rose-500/20 bg-rose-500/[0.07] text-rose-300'
                        : 'border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-300',
                    )}
                  >
                    <ShieldAlert className="size-3.5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-xs font-medium text-slate-200 group-hover:text-emerald-300">
                        {truncate(review.pullRequest.title, 64)}
                      </p>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500">
                      <span className="font-mono">
                        {review.owner}/{review.repo}
                      </span>
                      <span className="text-slate-700">·</span>
                      <span>#{review.prNumber}</span>
                      <span className="text-slate-700">·</span>
                      <span>{formatRelativeTime(review.analyzedAt)}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs font-semibold tabular-nums text-slate-200">
                        {summary.total}
                      </p>
                      <p className="text-[9px] uppercase tracking-wider text-slate-600">
                        findings
                      </p>
                    </div>
                    {serious > 0 ? (
                      <span className={cn('rounded-md border px-1.5 py-0.5 text-[10px] font-medium', meta.badgeClass)}>
                        {serious} urgent
                      </span>
                    ) : null}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
