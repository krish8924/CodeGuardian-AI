import { useEffect, useState } from 'react'
import { AlertCircle, ChevronRight, FileDiff } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { DiffPatch, FileStatusBadge } from '@/components/ui/DiffPatch'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingBlock } from '@/components/ui/Spinner'
import { api } from '@/services/api'
import type { DiffResponse } from '@/types/api'
import { getErrorMessage } from '@/utils/format'

export function DiffPanel({
  owner,
  repo,
  prNumber,
}: {
  owner: string
  repo: string
  prNumber: number
}) {
  const [diff, setDiff] = useState<DiffResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    api
      .getDiff(owner, repo, prNumber)
      .then((response) => {
        if (!cancelled) setDiff(response)
      })
      .catch((requestError: unknown) => {
        if (!cancelled) setError(getErrorMessage(requestError))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [owner, prNumber, repo, retryToken])

  if (loading) {
    return (
      <Card>
        <CardBody className="py-10">
          <LoadingBlock label="Loading pull request diff…" />
        </CardBody>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardBody className="py-6">
          <Alert variant="error" title="Could not load the diff">
            {error}
          </Alert>
          <div className="mt-4 flex justify-center">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<AlertCircle className="size-3.5" />}
              onClick={() => setRetryToken((current) => current + 1)}
            >
              Try again
            </Button>
          </div>
        </CardBody>
      </Card>
    )
  }

  if (!diff || diff.files.length === 0) {
    return (
      <EmptyState
        icon={FileDiff}
        title="No diff available"
        description="The backend returned no file patches for this pull request."
        className="py-12"
      />
    )
  }

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Pull request diff</CardTitle>
            <CardDescription>
              Patches returned by the backend for {diff.total_files} changed file
              {diff.total_files === 1 ? '' : 's'}.
            </CardDescription>
          </div>
        </CardHeader>
        <CardBody className="pt-3">
          <Alert variant="info">
            GitHub may omit patches for binary, renamed or very large files. Those entries are
            shown without a patch rather than being treated as analysis failures.
          </Alert>
        </CardBody>
      </Card>

      <div className="space-y-2">
        {diff.files.map((file, index) => (
          <details
            key={file.filename}
            open={index < 2}
            className="group overflow-hidden rounded-xl border border-line bg-panel"
          >
            <summary className="flex cursor-pointer list-none items-center gap-2.5 px-4 py-3 transition-colors hover:bg-white/[0.02] [&::-webkit-details-marker]:hidden">
              <ChevronRight className="size-3.5 shrink-0 text-slate-500 transition-transform group-open:rotate-90" />
              <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-slate-300">
                {file.filename}
              </span>
              <FileStatusBadge status={file.status} />
              <span className="hidden text-[10px] text-slate-600 sm:inline">
                {file.patch ? `${file.patch.split('\n').length} lines` : 'no patch'}
              </span>
            </summary>
            <div className="border-t border-line bg-canvas/30 p-2.5">
              <DiffPatch patch={file.patch} filename={file.filename} showHeader={false} />
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}
