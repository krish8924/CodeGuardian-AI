import { useMemo, useState } from 'react'
import {
  ArrowUpRight,
  FileCode2,
  GitPullRequest,
  History,
  Search,
  ShieldAlert,
  Trash2,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useReviewHistory } from '@/hooks/useReviewHistory'
import { useToast } from '@/hooks/useToast'
import type { ReviewRecord, SeverityKey } from '@/types/api'
import { cn } from '@/utils/cn'
import { formatDateTime, formatRelativeTime, pluralize, truncate } from '@/utils/format'
import { reviewPath } from '@/utils/github'
import { normalizeSeverity, SEVERITY_ORDER, severityMeta, summarizeSeverities } from '@/utils/severity'

type SeverityFilter = 'all' | SeverityKey

function SeverityCount({
  severity,
  count,
}: {
  severity: SeverityKey
  count: number
}) {
  if (count === 0) return null
  const meta = severityMeta(severity)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium leading-5',
        meta.badgeClass,
      )}
    >
      <span className={cn('size-1.5 rounded-full', meta.dotClass)} />
      {meta.label} {count}
    </span>
  )
}

function ReviewRow({
  review,
  onDelete,
}: {
  review: ReviewRecord
  onDelete: (review: ReviewRecord) => void
}) {
  const summary = summarizeSeverities(review.findings)
  const serious = summary.critical + summary.high
  const to = reviewPath(review.owner, review.repo, review.prNumber)

  return (
    <Card className="group p-4 transition-colors hover:border-line-strong">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <Link to={to} className="flex min-w-0 flex-1 items-start gap-3">
          <span
            className={cn(
              'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border',
              serious > 0
                ? 'border-rose-500/20 bg-rose-500/[0.07] text-rose-300'
                : 'border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-300',
            )}
          >
            <ShieldAlert className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="min-w-0 truncate text-sm font-medium text-slate-100 transition-colors group-hover:text-emerald-300">
                {truncate(review.pullRequest.title, 90)}
              </h3>
              {serious > 0 ? (
                <span className="rounded border border-rose-500/20 bg-rose-500/[0.07] px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-rose-300">
                  Attention
                </span>
              ) : null}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
              <span className="font-mono text-slate-400">
                {review.owner}/{review.repo}
              </span>
              <span className="text-slate-700">·</span>
              <span>#{review.prNumber}</span>
              <span className="text-slate-700">·</span>
              <span>by {review.pullRequest.author}</span>
              <span className="text-slate-700">·</span>
              <span title={formatDateTime(review.analyzedAt)}>
                {formatRelativeTime(review.analyzedAt)}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-md border border-line-strong bg-white/[0.03] px-1.5 py-0.5 text-[10px] text-slate-400">
                <FileCode2 className="size-2.5" />
                {review.files.length} {pluralize(review.files.length, 'file')}
              </span>
              {SEVERITY_ORDER.filter((severity) => severity !== 'unknown').map((severity) => (
                <SeverityCount key={severity} severity={severity} count={summary[severity]} />
              ))}
            </div>
          </div>
        </Link>

        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-line pt-3 lg:justify-end lg:border-0 lg:pt-0">
          <div className="text-left lg:text-right">
            <p className="text-sm font-semibold tabular-nums text-slate-200">{summary.total}</p>
            <p className="text-[9px] uppercase tracking-wider text-slate-600">findings</p>
          </div>
          <Link to={to}>
            <Button variant="secondary" size="sm" rightIcon={<ArrowUpRight className="size-3" />}>
              View report
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(review)}
            aria-label={`Delete review for ${review.owner}/${review.repo} #${review.prNumber}`}
            className="text-slate-600 hover:text-rose-300"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

export function ReviewsPage() {
  useDocumentTitle('Review History')

  const navigate = useNavigate()
  const { reviews, removeReview, clearReviews, storageError } = useReviewHistory()
  const { toast } = useToast()

  const [query, setQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all')
  const [confirmClear, setConfirmClear] = useState(false)

  const filtered = useMemo(() => {
    const lowered = query.trim().toLowerCase()

    return reviews.filter((review) => {
      if (severityFilter !== 'all') {
        const hasSeverity = review.findings.some(
          (finding) => normalizeSeverity(finding.severity) === severityFilter,
        )
        if (!hasSeverity) return false
      }

      if (!lowered) return true

      const haystack = [
        review.owner,
        review.repo,
        String(review.prNumber),
        review.pullRequest.title,
        review.pullRequest.author,
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(lowered)
    })
  }, [query, reviews, severityFilter])

  const severityOptions: Array<{ key: SeverityFilter; label: string }> = [
    { key: 'all', label: 'All' },
    ...(['critical', 'high', 'medium', 'low'] as SeverityKey[]).map((key) => ({
      key,
      label: severityMeta(key).label,
    })),
  ]

  function handleDelete(review: ReviewRecord) {
    removeReview(review.id)
    toast({
      title: 'Review removed',
      description: `${review.owner}/${review.repo} #${review.prNumber} was removed from this browser.`,
      variant: 'info',
    })
  }

  function handleClear() {
    clearReviews()
    setConfirmClear(false)
    toast({
      title: 'Review history cleared',
      description: 'All locally stored review reports were removed from this browser.',
      variant: 'info',
    })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Reports"
        title="Review history"
        description="Reports saved after successful scanner runs. The backend has no history endpoint, so this list lives in your browser."
        actions={
          <>
            {reviews.length > 0 ? (
              <Button
                variant="ghost"
                leftIcon={<Trash2 className="size-3.5" />}
                onClick={() => setConfirmClear(true)}
                className="text-slate-500 hover:text-rose-300"
              >
                Clear history
              </Button>
            ) : null}
            <Button
              leftIcon={<GitPullRequest className="size-4" />}
              onClick={() => navigate('/workspace')}
            >
              New review
            </Button>
          </>
        }
      />

      {storageError ? (
        <Alert variant="warning" title="Local history unavailable">
          {storageError}
        </Alert>
      ) : null}

      <Alert variant="info" title="History is browser-local">
        The FastAPI backend does not expose endpoints for listing previous analyses. Reports are
        stored in <code className="font-mono text-[11px]">localStorage</code> after a successful
        review, and only the latest run per pull request is kept.
      </Alert>

      {reviews.length > 0 ? (
        <div className="flex flex-col gap-3 rounded-xl border border-line bg-panel/60 p-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search repository, PR title or author…"
              leadingIcon={<Search className="size-4" />}
              aria-label="Search reviews"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {severityOptions.map((option) => {
              const isActive = severityFilter === option.key
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setSeverityFilter(option.key)}
                  aria-pressed={isActive}
                  className={cn(
                    'rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-colors',
                    isActive
                      ? 'border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-300'
                      : 'border-line bg-white/[0.02] text-slate-500 hover:bg-white/[0.04] hover:text-slate-300',
                  )}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      {reviews.length === 0 ? (
        <EmptyState
          icon={History}
          title="No reviews stored yet"
          description="Run a security review against a GitHub pull request. Successful reports will appear here and remain available in this browser."
          action={
            <Button onClick={() => navigate('/workspace')} leftIcon={<GitPullRequest className="size-4" />}>
              Review a pull request
            </Button>
          }
          className="py-16"
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching reviews"
          description="Try a different search term or severity filter."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setQuery('')
                setSeverityFilter('all')
              }}
            >
              Reset filters
            </Button>
          }
          className="py-12"
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((review) => (
            <ReviewRow key={review.id} review={review} onDelete={handleDelete} />
          ))}
          <p className="px-1 pt-1 text-[10px] text-slate-600">
            Showing {filtered.length} of {reviews.length} stored{' '}
            {pluralize(reviews.length, 'review')}. Maximum 50 reviews are kept locally.
          </p>
        </div>
      )}

      <ConfirmDialog
        open={confirmClear}
        title="Clear review history?"
        description="This removes every locally stored report from this browser. It does not affect the backend, GitHub, or any webhook comments."
        confirmLabel="Clear all reports"
        onConfirm={handleClear}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  )
}
