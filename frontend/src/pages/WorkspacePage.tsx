import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { ArrowRight, History, ShieldCheck } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AnalysisProgress } from '@/components/editor/AnalysisProgress'
import { PullRequestForm, type TargetErrors } from '@/components/editor/PullRequestForm'
import { PullRequestPreview } from '@/components/editor/PullRequestPreview'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { useBackendStatus } from '@/hooks/useBackendStatus'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useReviewHistory } from '@/hooks/useReviewHistory'
import { useToast } from '@/hooks/useToast'
import {
  ApiError,
  analyzePullRequest,
  api,
  type AnalyzeProgress,
} from '@/services/api'
import type {
  ChangedFile,
  PullRequestResponse,
  SourceContentResponse,
} from '@/types/api'
import { getErrorMessage } from '@/utils/format'
import { reviewPath } from '@/utils/github'

interface PreviewState {
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null
  pullRequest: PullRequestResponse | null
  files: ChangedFile[]
}

interface ReviewTarget {
  owner: string
  repo: string
  prNumber: number
}

interface AnalysisFailure {
  message: string
  status?: number
  isNetworkError: boolean
  isTimeout: boolean
}

const EMPTY_PREVIEW: PreviewState = {
  status: 'idle',
  error: null,
  pullRequest: null,
  files: [],
}

const GITHUB_SEGMENT = /^[A-Za-z0-9_.-]+$/

function validateTarget(owner: string, repo: string, prNumber: string): {
  target: ReviewTarget | null
  errors: TargetErrors
} {
  const errors: TargetErrors = {}
  const trimmedOwner = owner.trim()
  const trimmedRepo = repo.trim()
  const parsedPr = Number(prNumber)

  if (!trimmedOwner) {
    errors.owner = 'Repository owner is required.'
  } else if (!GITHUB_SEGMENT.test(trimmedOwner)) {
    errors.owner = 'Use a valid GitHub owner or organisation name.'
  }

  if (!trimmedRepo) {
    errors.repo = 'Repository name is required.'
  } else if (!GITHUB_SEGMENT.test(trimmedRepo)) {
    errors.repo = 'Use a valid GitHub repository name.'
  }

  if (!prNumber.trim()) {
    errors.prNumber = 'Pull request number is required.'
  } else if (!Number.isInteger(parsedPr) || parsedPr <= 0) {
    errors.prNumber = 'Enter a positive pull request number.'
  }

  if (Object.keys(errors).length > 0) return { target: null, errors }

  return {
    target: {
      owner: trimmedOwner,
      repo: trimmedRepo,
      prNumber: parsedPr,
    },
    errors,
  }
}

function failureFromError(error: unknown): AnalysisFailure {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      status: error.status,
      isNetworkError: error.isNetworkError,
      isTimeout: error.isTimeout,
    }
  }

  return {
    message: getErrorMessage(error),
    isNetworkError: false,
    isTimeout: false,
  }
}

function errorGuidance(failure: AnalysisFailure): string {
  if (failure.isNetworkError) {
    return 'Start the FastAPI backend on http://localhost:8000 and confirm VITE_API_BASE_URL matches. The backend also requires GITHUB_TOKEN and GITHUB_WEBHOOK_SECRET to boot.'
  }
  if (failure.isTimeout) {
    return 'The scan exceeded the 10 minute client timeout. Check the FastAPI logs and try a smaller pull request.'
  }
  if (failure.status === 404) {
    return 'Verify the owner, repository and PR number. The backend GitHub token must have access to the repository.'
  }
  if (failure.status === 500) {
    return 'Inspect the FastAPI logs. Common causes are an invalid GitHub token, insufficient repository permissions, or missing semgrep, bandit or gitleaks binaries on the backend machine.'
  }
  return 'Check the FastAPI logs for the request and confirm the backend configuration.'
}

export function WorkspacePage() {
  useDocumentTitle('Code Review')

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { addReview } = useReviewHistory()
  const { toast } = useToast()
  const { health } = useBackendStatus()

  const [owner, setOwner] = useState(searchParams.get('owner') ?? '')
  const [repo, setRepo] = useState(searchParams.get('repo') ?? '')
  const [prNumber, setPrNumber] = useState(searchParams.get('pr') ?? '')
  const [errors, setErrors] = useState<TargetErrors>({})

  const [analyzing, setAnalyzing] = useState(false)
  const [progress, setProgress] = useState<AnalyzeProgress | null>(null)
  const [analysisFailure, setAnalysisFailure] = useState<AnalysisFailure | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const startedAt = useRef<number | null>(null)

  const [preview, setPreview] = useState<PreviewState>(EMPTY_PREVIEW)
  const [previewTarget, setPreviewTarget] = useState<ReviewTarget | null>(null)
  const [sourceContent, setSourceContent] = useState<SourceContentResponse | null>(null)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [sourceLoading, setSourceLoading] = useState(false)
  const [sourceError, setSourceError] = useState<string | null>(null)

  useEffect(() => {
    if (!analyzing) return

    const interval = window.setInterval(() => {
      if (startedAt.current) {
        setElapsedSeconds(Math.floor((Date.now() - startedAt.current) / 1000))
      }
    }, 1000)

    return () => window.clearInterval(interval)
  }, [analyzing])

  const sourceFile = useMemo(() => {
    if (!sourceContent || !selectedFile) return null
    return sourceContent.files.find((file) => file.filename === selectedFile) ?? null
  }, [selectedFile, sourceContent])

  const handlePreview = useCallback(async () => {
    const { target, errors: nextErrors } = validateTarget(owner, repo, prNumber)
    setErrors(nextErrors)
    if (!target) return

    setPreview({ status: 'loading', error: null, pullRequest: null, files: [] })
    setPreviewTarget(target)
    setSourceContent(null)
    setSelectedFile(null)
    setSourceError(null)

    try {
      const [pullRequest, changedFiles] = await Promise.all([
        api.getPullRequest(target.owner, target.repo, target.prNumber),
        api.getChangedFiles(target.owner, target.repo, target.prNumber),
      ])

      setPreview({
        status: 'ready',
        error: null,
        pullRequest,
        files: changedFiles.files,
      })
    } catch (error) {
      setPreview({
        status: 'error',
        error: getErrorMessage(error),
        pullRequest: null,
        files: [],
      })
    }
  }, [owner, prNumber, repo])

  const handleSelectFile = useCallback(
    async (filename: string) => {
      setSelectedFile(filename)
      setSourceError(null)

      if (sourceContent || !previewTarget) return

      setSourceLoading(true)

      try {
        const content = await api.getSourceContent(
          previewTarget.owner,
          previewTarget.repo,
          previewTarget.prNumber,
        )
        setSourceContent(content)
      } catch (error) {
        setSourceError(getErrorMessage(error))
      } finally {
        setSourceLoading(false)
      }
    },
    [previewTarget, sourceContent],
  )

  const runAnalysis = useCallback(async () => {
    const { target, errors: nextErrors } = validateTarget(owner, repo, prNumber)
    setErrors(nextErrors)
    if (!target) return

    setAnalysisFailure(null)
    setAnalyzing(true)
    setProgress(null)
    setElapsedSeconds(0)
    startedAt.current = Date.now()

    try {
      const review = await analyzePullRequest(
        target.owner,
        target.repo,
        target.prNumber,
        setProgress,
      )

      addReview(review)
      toast({
        title: 'Review completed',
        description: `${target.owner}/${target.repo} #${target.prNumber} returned ${review.totalFindings} finding${review.totalFindings === 1 ? '' : 's'}.`,
        variant: 'success',
      })
      navigate(reviewPath(target.owner, target.repo, target.prNumber))
    } catch (error) {
      setAnalysisFailure(failureFromError(error))
      toast({
        title: 'Review failed',
        description: getErrorMessage(error),
        variant: 'error',
      })
    } finally {
      setAnalyzing(false)
      setProgress(null)
      startedAt.current = null
    }
  }, [addReview, navigate, owner, prNumber, repo, toast])

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      void runAnalysis()
    },
    [runAnalysis],
  )

  const targetLabel = `${owner.trim() || 'owner'}/${repo.trim() || 'repository'}#${prNumber || 'PR'}`

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Workspace"
        title="Code review"
        description="Run the existing CodeGuardian AI security pipeline against a GitHub pull request and inspect the scanner's actual findings."
        actions={
          <Button
            variant="secondary"
            leftIcon={<History className="size-4" />}
            onClick={() => navigate('/reviews')}
          >
            Review history
          </Button>
        }
      />

      {health === 'offline' ? (
        <Alert variant="warning" title="Backend is not reachable">
          Start the FastAPI server before running a review. The frontend proxies `/api` requests
          to the URL configured in <code className="font-mono text-[11px]">VITE_API_BASE_URL</code>.
        </Alert>
      ) : null}

      {analysisFailure ? (
        <Alert variant="error" title="Security review failed">
          <p>{analysisFailure.message}</p>
          <p className="mt-1.5 text-slate-500">{errorGuidance(analysisFailure)}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 -ml-2"
            onClick={() => setAnalysisFailure(null)}
          >
            Dismiss
          </Button>
        </Alert>
      ) : null}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,430px)_minmax(0,1fr)]">
        <div className="space-y-4">
          <PullRequestForm
            owner={owner}
            repo={repo}
            prNumber={prNumber}
            errors={errors}
            analyzing={analyzing}
            previewLoading={preview.status === 'loading'}
            onOwnerChange={(value) => {
              setOwner(value)
              if (errors.owner) setErrors((current) => ({ ...current, owner: undefined }))
            }}
            onRepoChange={(value) => {
              setRepo(value)
              if (errors.repo) setErrors((current) => ({ ...current, repo: undefined }))
            }}
            onPrNumberChange={(value) => {
              setPrNumber(value)
              if (errors.prNumber) setErrors((current) => ({ ...current, prNumber: undefined }))
            }}
            onSubmit={handleSubmit}
            onPreview={() => void handlePreview()}
          />

          <Card>
            <CardHeader>
              <div>
                <CardTitle>API boundaries</CardTitle>
                <CardDescription>What this workspace can and cannot do today.</CardDescription>
              </div>
              <ShieldCheck className="size-4 text-slate-500" />
            </CardHeader>
            <CardBody className="pt-4">
              <ul className="space-y-2.5 text-[11px] leading-relaxed text-slate-500">
                <li className="flex gap-2">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-emerald-400/70" />
                  Reviews target GitHub pull requests through the backend&apos;s existing
                  `/github/pr/...` routes.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-amber-400/70" />
                  No paste-code endpoint exists, so arbitrary source cannot be analysed from this
                  UI.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-amber-400/70" />
                  Review history is saved in this browser; the backend has no persistence API.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-amber-400/70" />
                  Groq AI explanations are only posted to GitHub from the webhook flow.
                </li>
              </ul>
            </CardBody>
          </Card>
        </div>

        {analyzing ? (
          <AnalysisProgress target={targetLabel} progress={progress} elapsedSeconds={elapsedSeconds} />
        ) : (
          <PullRequestPreview
            status={preview.status}
            error={preview.error}
            pullRequest={preview.pullRequest}
            files={preview.files}
            selectedFile={selectedFile}
            sourceFile={sourceFile}
            sourceLoading={sourceLoading}
            sourceError={sourceError}
            onSelectFile={(filename) => void handleSelectFile(filename)}
            onReload={() => void handlePreview()}
          />
        )}
      </div>

      {!analyzing && preview.status === 'ready' ? (
        <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-line bg-panel/70 p-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-medium text-slate-200">Ready to scan this pull request?</p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              The review will run Semgrep, Bandit and Gitleaks, then open the findings report.
            </p>
          </div>
          <Button
            size="sm"
            rightIcon={<ArrowRight className="size-3.5" />}
            onClick={() => void runAnalysis()}
          >
            Run security review
          </Button>
        </div>
      ) : null}
    </div>
  )
}
