import {
  FileCode2,
  GitBranch,
  GitPullRequest,
  RefreshCw,
  UserRound,
} from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { CodeViewer } from '@/components/ui/CodeBlock'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingBlock } from '@/components/ui/Spinner'
import { FileStatusBadge } from '@/components/ui/DiffPatch'
import type { ChangedFile, PullRequestResponse, SourceFile } from '@/types/api'
import { cn } from '@/utils/cn'
import { formatNumber } from '@/utils/format'

type PreviewStatus = 'idle' | 'loading' | 'ready' | 'error'

interface PullRequestPreviewProps {
  status: PreviewStatus
  error: string | null
  pullRequest: PullRequestResponse | null
  files: ChangedFile[]
  selectedFile: string | null
  sourceFile: SourceFile | null
  sourceLoading: boolean
  sourceError: string | null
  onSelectFile: (filename: string) => void
  onReload: () => void
}

function stateVariant(state: string): 'accent' | 'danger' | 'warning' | 'neutral' {
  if (state === 'open') return 'accent'
  if (state === 'closed') return 'danger'
  return 'neutral'
}

export function PullRequestPreview({
  status,
  error,
  pullRequest,
  files,
  selectedFile,
  sourceFile,
  sourceLoading,
  sourceError,
  onSelectFile,
  onReload,
}: PullRequestPreviewProps) {
  const additions = files.reduce((sum, file) => sum + file.additions, 0)
  const deletions = files.reduce((sum, file) => sum + file.deletions, 0)

  return (
    <Card className="flex h-full min-h-[520px] flex-col">
      <CardHeader>
        <div>
          <CardTitle>Pull request preview</CardTitle>
          <CardDescription>
            Inspect metadata and changed-file source before running the security review.
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onReload}
          disabled={status === 'loading'}
          aria-label="Reload pull request preview"
          className="-mr-1 -mt-1"
        >
          <RefreshCw className={cn('size-3.5', status === 'loading' && 'animate-spin')} />
        </Button>
      </CardHeader>

      <CardBody className="flex flex-1 flex-col pt-4">
        {status === 'idle' ? (
          <EmptyState
            icon={GitPullRequest}
            title="Preview a pull request"
            description="Enter an owner, repository and PR number, then select “Preview pull request” to inspect the changed files and source code."
            className="flex-1"
          />
        ) : null}

        {status === 'loading' ? <LoadingBlock label="Loading pull request…" className="flex-1" /> : null}

        {status === 'error' ? (
          <div className="flex flex-1 flex-col justify-center gap-4">
            <Alert variant="error" title="Could not load pull request">
              {error ?? 'The backend did not return pull request details.'}
            </Alert>
            <div className="flex justify-center">
              <Button variant="secondary" size="sm" onClick={onReload}>
                Try again
              </Button>
            </div>
          </div>
        ) : null}

        {status === 'ready' && pullRequest ? (
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <div className="rounded-xl border border-line bg-canvas/50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="neutral">#{pullRequest.number}</Badge>
                <Badge variant={stateVariant(pullRequest.state)} className="capitalize">
                  {pullRequest.state}
                </Badge>
                <span className="ml-auto font-mono text-[10px] text-slate-600">
                  {files.length} changed file{files.length === 1 ? '' : 's'}
                </span>
              </div>
              <h3 className="mt-2.5 text-sm font-semibold leading-snug text-slate-100">
                {pullRequest.title}
              </h3>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <UserRound className="size-3" />
                  {pullRequest.author}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <GitBranch className="size-3" />
                  <span className="font-mono">{pullRequest.source_branch}</span>
                  <span className="text-slate-700">→</span>
                  <span className="font-mono">{pullRequest.target_branch}</span>
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px]">
                <span className="text-emerald-400">+{formatNumber(additions)} additions</span>
                <span className="text-rose-400">−{formatNumber(deletions)} deletions</span>
              </div>
            </div>

            <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
              <div className="flex min-h-0 flex-col">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Changed files
                </p>
                <div className="max-h-[260px] flex-1 space-y-1 overflow-y-auto rounded-lg border border-line bg-canvas/40 p-1.5 xl:max-h-[430px]">
                  {files.length === 0 ? (
                    <p className="px-2 py-4 text-center text-[11px] text-slate-500">
                      No changed files were returned.
                    </p>
                  ) : (
                    files.map((file) => {
                      const isActive = selectedFile === file.filename

                      return (
                        <button
                          key={file.filename}
                          type="button"
                          onClick={() => onSelectFile(file.filename)}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors',
                            isActive
                              ? 'bg-emerald-500/[0.08] text-emerald-200'
                              : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200',
                          )}
                        >
                          <FileCode2
                            className={cn(
                              'size-3.5 shrink-0',
                              isActive ? 'text-emerald-400' : 'text-slate-600',
                            )}
                          />
                          <span className="min-w-0 flex-1 truncate font-mono text-[10.5px]">
                            {file.filename}
                          </span>
                          <span className="shrink-0 text-[9px] tabular-nums">
                            <span className="text-emerald-500">+{file.additions}</span>{' '}
                            <span className="text-rose-500">−{file.deletions}</span>
                          </span>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>

              <div className="flex min-h-0 min-w-0 flex-col">
                {sourceLoading ? (
                  <LoadingBlock label="Loading source file…" className="flex-1" />
                ) : sourceError ? (
                  <Alert variant="warning" title="Source unavailable">
                    {sourceError}
                  </Alert>
                ) : sourceFile ? (
                  <div className="flex min-h-0 flex-col gap-2">
                    <CodeViewer
                      title={sourceFile.filename}
                      subtitle={
                        <>
                          {sourceFile.language} · {formatNumber(sourceFile.content.split('\n').length)}{' '}
                          lines · language detected by backend
                        </>
                      }
                      code={sourceFile.content}
                      language={sourceFile.language}
                      className="max-h-[380px]"
                    />
                    <p className="text-[10px] text-slate-600">
                      Content is loaded from the backend&apos;s `/content` endpoint for the pull
                      request head commit.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-line-strong/70 px-5 py-10 text-center">
                    <FileCode2 className="size-6 text-slate-600" />
                    <p className="mt-2 text-xs font-medium text-slate-400">Select a file</p>
                    <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-slate-600">
                      Choose a changed file to load its source with syntax highlighting.
                    </p>
                  </div>
                )}
                {selectedFile ? (
                  <div className="mt-2 flex items-center gap-2">
                    <FileStatusBadge
                      status={files.find((file) => file.filename === selectedFile)?.status ?? 'modified'}
                    />
                    <span className="truncate font-mono text-[10px] text-slate-600">
                      {selectedFile}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </CardBody>
    </Card>
  )
}
