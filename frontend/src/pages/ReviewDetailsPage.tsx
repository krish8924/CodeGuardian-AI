import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ExternalLink,
  FileCode2,
  FileDiff,
  GitBranch,
  History,
  Loader2,
  RefreshCw,
  ScanSearch,
  ShieldAlert,
  Sparkles,
  StickyNote,
  UserRound,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChangedFilesPanel } from '@/components/results/ChangedFilesPanel'
import { DiffPanel } from '@/components/results/DiffPanel'
import { FindingsPanel } from '@/components/results/FindingsPanel'
import { ReviewNotesPanel } from '@/components/results/ReviewNotesPanel'
import { SeverityDonut } from '@/components/charts/SeverityDonut'
import { ToolBreakdown } from '@/components/results/ToolBreakdown'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useReviewHistory } from '@/hooks/useReviewHistory'
import { useToast } from '@/hooks/useToast'
import { analyzePullRequest, reviewId, type AnalyzeProgress } from '@/services/api'
import { cn } from '@/utils/cn'
import { formatDateTime, getErrorMessage, safeDecodeURIComponent } from '@/utils/format'
import { pullRequestUrl } from '@/utils/github'
import { countByTool } from '@/utils/findings'
import { summarizeSeverities } from '@/utils/severity'

type TabKey = 'findings' | 'files' | 'diff' | 'notes'

const TABS: Array<{ key: TabKey; label: string; icon: typeof ScanSearch }> = [
  { key: 'findings', label: 'Findings', icon: ScanSearch },
  { key: 'files', label: 'Changed files', icon: FileCode2 },
  { key: 'diff', label: 'Diff', icon: FileDiff },
  { key: 'notes', label: 'Review notes', icon: StickyNote },
]

function formatElapsed(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`
}

function stateVariant(state: string): 'accent' | 'danger' | 'neutral' {
  if (state === 'open') return 'accent'
  if (state === 'closed') return 'danger'
  return 'neutral'
}

export function ReviewDetailsPage() {
  const params = useParams<{ owner: string; repo: string; prNumber: string }>()
  const owner = safeDecodeURIComponent(params.owner ?? '')
  const repo = safeDecodeURIComponent(params.repo ?? '')
  const prNumber = Number(params.prNumber)
  const validTarget = Boolean(owner && repo && Number.isInteger(prNumber) && prNumber > 0)

  const navigate = useNavigate()
  const { addReview, getReview } = useReviewHistory()
  const { toast } = useToast()

  const review = validTarget ? getReview(reviewId(owner, repo, prNumber)) : undefined

  useDocumentTitle(review ? `${review.repo} #${review.prNumber}` : 'Review details')

  const [tab, setTab] = useState<TabKey>('findings')
  const [running, setRunning] = useState(false)
  const [runProgress, setRunProgress] = useState<AnalyzeProgress | null>(null)
  const [runError, setRunError] = useState<string | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [startedAt, setStartedAt] = useState<number | null>(null)

  useEffect(() => {
    if (!running || !startedAt) return

    const interval = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000))
    }, 1000)

    return () => window.clearInterval(interval)
  }, [running, startedAt])

  const runReview = useCallback(async () => {
    if (!validTarget) return

    setRunning(true)
    setRunProgress(null)
    setRunError(null)
    setElapsedSeconds(0)
    setStartedAt(Date.now())

    try {
      const record = await analyzePullRequest(owner, repo, prNumber, setRunProgress)
      addReview(record)
      toast({
        title: 'Review completed',
        description: `${owner}/${repo} #${prNumber} returned ${record.totalFindings} finding${record.totalFindings === 1 ? '' : 's'}.`,
        variant: 'success',
      })
    } catch (error) {
      const message = getErrorMessage(error)
      setRunError(message)
      toast({ title: 'Review failed', description: message, variant: 'error' })
    } finally {
      setRunning(false)
      setRunProgress(null)
      setStartedAt(null)
    }
  }, [addReview, owner, prNumber, repo, toast, validTarget])

  const summary = useMemo(
    () => summarizeSeverities(review?.findings ?? []),
    [review?.findings],
  )
  const tools = useMemo(() => countByTool(review?.findings ?? []), [review?.findings])

  if (!validTarget) {
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Reports"
          title="Invalid review link"
          description="The review URL must contain a GitHub owner, repository and numeric pull request number."
          actions={
            <Button variant="secondary" leftIcon={<ArrowLeft className="size-4" />} onClick={() => navigate('/reviews')}>
              Back to history
            </Button>
          }
        />
        <EmptyState
          icon={History}
          title="Review not found"
          description="Return to the review history or open the workspace to analyse a pull request."
          action={
            <Button onClick={() => navigate('/workspace')}>Open workspace</Button>
          }
          className="py-16"
        />
      </div>
    )
  }

  if (!review) {
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Reports"
          title={`${owner}/${repo} · PR #${prNumber}`}
          description="This report is not stored in this browser. Review reports are local because the backend has no history endpoint."
          actions={
            <Button variant="secondary" leftIcon={<ArrowLeft className="size-4" />} onClick={() => navigate('/reviews')}>
              Back to history
            </Button>
          }
        />

        {runError ? (
          <Alert variant="error" title="Could not run the review">
            {runError}
          </Alert>
        ) : null}

        {running ? (
          <Card>
            <CardBody className="py-8">
              <div className="flex flex-col items-center text-center">
                <Loader2 className="size-6 animate-spin text-emerald-400" />
                <h2 className="mt-3 text-sm font-semibold text-slate-100">Review in progress</h2>
                <p className="mt-1 font-mono text-[11px] text-emerald-300/70">
                  {owner}/{repo} #{prNumber}
                </p>
                <p className="mt-2 max-w-md text-xs leading-relaxed text-slate-500">
                  {runProgress?.message ?? 'Starting the review…'}
                </p>
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-white/[0.03] px-2 py-1 text-[10px] tabular-nums text-slate-500">
                  Elapsed {formatElapsed(elapsedSeconds)}
                </p>
                <p className="mt-3 max-w-md text-[11px] text-slate-600">
                  Scans run synchronously and can take several minutes for large pull requests.
                </p>
              </div>
            </CardBody>
          </Card>
        ) : (
          <EmptyState
            icon={History}
            title="No stored report for this pull request"
            description="Run the security review now or open the workspace to inspect the pull request first. Successful results will be saved in this browser."
            action={
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button leftIcon={<ScanSearch className="size-4" />} onClick={() => void runReview()}>
                  Run review now
                </Button>
                <Link
                  to={`/workspace?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&pr=${prNumber}`}
                >
                  <Button variant="secondary">Open workspace</Button>
                </Link>
              </div>
            }
            className="py-16"
          />
        )}
      </div>
    )
  }

  const prUrl = pullRequestUrl(review.owner, review.repo, review.prNumber)
  const serious = summary.critical + summary.high

  return (
    <div className="space-y-5">
      <Link
        to="/reviews"
        className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 transition-colors hover:text-slate-300"
      >
        <ArrowLeft className="size-3" />
        Review history
      </Link>

      <PageHeader
        eyebrow={`${review.owner}/${review.repo} · PR #${review.prNumber}`}
        title={review.pullRequest.title}
        description={`Analysed ${formatDateTime(review.analyzedAt)}. Scanner findings are returned directly by the backend security endpoint.`}
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={<ExternalLink className="size-3.5" />}
              onClick={() => window.open(prUrl, '_blank', 'noopener,noreferrer')}
            >
              Open on GitHub
            </Button>
            <Button
              loading={running}
              leftIcon={<RefreshCw className="size-3.5" />}
              onClick={() => void runReview()}
            >
              {running ? 'Re-running…' : 'Re-run review'}
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-line bg-panel/60 px-4 py-3 text-[11px] text-slate-500">
        <Badge variant={stateVariant(review.pullRequest.state)} className="capitalize">
          {review.pullRequest.state}
        </Badge>
        <span className="inline-flex items-center gap-1.5">
          <UserRound className="size-3" />
          {review.pullRequest.author}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <GitBranch className="size-3" />
          <span className="font-mono">{review.pullRequest.source_branch}</span>
          <span className="text-slate-700">→</span>
          <span className="font-mono">{review.pullRequest.target_branch}</span>
        </span>
        <span className="ml-auto text-[10px] text-slate-600">
          Stored locally in this browser
        </span>
      </div>

      {running ? (
        <Card className="border-emerald-500/20 bg-emerald-500/[0.03]">
          <CardBody className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <Loader2 className="size-4 animate-spin text-emerald-400" />
              <div>
                <p className="text-xs font-medium text-slate-200">Re-running security review</p>
                <p className="text-[11px] text-slate-500">
                  {runProgress?.message ?? 'Starting the review…'}
                </p>
              </div>
            </div>
            <span className="text-[10px] tabular-nums text-slate-500">
              Elapsed {formatElapsed(elapsedSeconds)}
            </span>
          </CardBody>
        </Card>
      ) : null}

      {runError ? (
        <Alert variant="error" title="Re-run failed">
          {runError}
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total findings"
          value={summary.total}
          hint="Returned by the security endpoint"
          icon={ScanSearch}
          tone={summary.total > 0 ? 'accent' : 'default'}
        />
        <StatCard
          label="High & critical"
          value={serious}
          hint={serious > 0 ? 'Prioritise remediation' : 'No urgent findings'}
          icon={ShieldAlert}
          tone={serious > 0 ? 'danger' : 'default'}
        />
        <StatCard
          label="Scanners reporting"
          value={tools.length}
          hint={tools.length > 0 ? tools.map((tool) => tool.tool).join(', ') : 'No scanner findings'}
          icon={ScanSearch}
        />
        <StatCard
          label="Changed files"
          value={review.files.length}
          hint="Files returned by the GitHub endpoint"
          icon={FileCode2}
        />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_310px] 2xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="min-w-0">
          <div
            className="flex items-center gap-1 overflow-x-auto border-b border-line"
            role="tablist"
            aria-label="Review sections"
          >
            {TABS.map((item) => {
              const Icon = item.icon
              const active = tab === item.key
              const count =
                item.key === 'findings'
                  ? review.findings.length
                  : item.key === 'files'
                    ? review.files.length
                    : null

              return (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  id={`review-tab-${item.key}`}
                  aria-selected={active}
                  aria-controls={`review-panel-${item.key}`}
                  onClick={() => setTab(item.key)}
                  className={cn(
                    'relative flex shrink-0 items-center gap-2 px-3 py-2.5 text-[11px] font-medium transition-colors',
                    active ? 'text-emerald-300' : 'text-slate-500 hover:text-slate-300',
                  )}
                >
                  <Icon className="size-3.5" />
                  {item.label}
                  {count !== null ? (
                    <span className="rounded border border-line-strong bg-white/[0.03] px-1 py-0.5 text-[9px] tabular-nums text-slate-500">
                      {count}
                    </span>
                  ) : null}
                  {active ? (
                    <span className="absolute inset-x-2 -bottom-px h-px bg-emerald-400" />
                  ) : null}
                </button>
              )
            })}
          </div>

          <div
            className="pt-3"
            role="tabpanel"
            id={`review-panel-${tab}`}
            aria-labelledby={`review-tab-${tab}`}
          >
            {tab === 'findings' ? (
              <FindingsPanel
                findings={review.findings}
                owner={review.owner}
                repo={review.repo}
                prNumber={review.prNumber}
              />
            ) : null}
            {tab === 'files' ? (
              <ChangedFilesPanel files={review.files} findings={review.findings} />
            ) : null}
            {tab === 'diff' ? (
              <DiffPanel owner={review.owner} repo={review.repo} prNumber={review.prNumber} />
            ) : null}
            {tab === 'notes' ? <ReviewNotesPanel review={review} /> : null}
          </div>
        </div>

        <aside className="space-y-3">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Severity distribution</CardTitle>
                <CardDescription>All findings in this review.</CardDescription>
              </div>
            </CardHeader>
            <CardBody className="pt-2">
              <SeverityDonut summary={summary} />
            </CardBody>
          </Card>

          <ToolBreakdown findings={review.findings} />

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Review context</CardTitle>
                <CardDescription>Metadata returned by the GitHub endpoint.</CardDescription>
              </div>
            </CardHeader>
            <CardBody className="pt-4">
              <dl className="space-y-2.5 text-[11px]">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500">Repository</dt>
                  <dd className="truncate font-mono text-slate-300">
                    {review.owner}/{review.repo}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500">Pull request</dt>
                  <dd className="font-mono text-slate-300">#{review.prNumber}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500">Author</dt>
                  <dd className="truncate text-slate-300">{review.pullRequest.author}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500">Analysed</dt>
                  <dd className="text-right text-slate-300">{formatDateTime(review.analyzedAt)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500">Report</dt>
                  <dd className="text-slate-300">Browser storage</dd>
                </div>
              </dl>
              <Button
                variant="secondary"
                size="sm"
                className="mt-4 w-full"
                leftIcon={<ExternalLink className="size-3" />}
                onClick={() => window.open(prUrl, '_blank', 'noopener,noreferrer')}
              >
                View pull request
              </Button>
            </CardBody>
          </Card>

          <Card className="border-dashed bg-white/[0.015]">
            <CardBody className="p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-200">
                <Sparkles className="size-3.5 text-emerald-400" />
                AI analysis
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
                Groq explanations are generated only during GitHub webhook scans and are posted as
                PR comments. The REST API returns scanner findings only.
              </p>
              <button
                type="button"
                onClick={() => setTab('notes')}
                className="mt-2 text-[11px] font-medium text-emerald-300 transition-colors hover:text-emerald-200"
              >
                Read the API limitation →
              </button>
            </CardBody>
          </Card>
        </aside>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line/60 pt-3 text-[10px] text-slate-600">
        <span>
          Report generated from the actual FastAPI response. Last run{' '}
          {formatDateTime(review.analyzedAt)}.
        </span>
        <Link
          to={`/workspace?owner=${encodeURIComponent(review.owner)}&repo=${encodeURIComponent(review.repo)}&pr=${review.prNumber}`}
          className="shrink-0 text-slate-500 transition-colors hover:text-slate-300"
        >
          Open in workspace →
        </Link>
      </div>
    </div>
  )
}
