import { Check, Loader2, Timer } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import type { AnalyzeProgress } from '@/services/api'
import type { ReviewStage } from '@/types/api'
import { cn } from '@/utils/cn'

const STAGES: Array<{ key: ReviewStage; label: string; description: string }> = [
  {
    key: 'preparing',
    label: 'Load pull request',
    description: 'Fetch metadata and changed files from GitHub.',
  },
  {
    key: 'scanning',
    label: 'Run scanners',
    description: 'Semgrep, Bandit and Gitleaks analyse the pull request.',
  },
  {
    key: 'finalizing',
    label: 'Build report',
    description: 'Normalise findings and prepare the review.',
  },
]

function formatElapsed(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`
}

export function AnalysisProgress({
  target,
  progress,
  elapsedSeconds,
}: {
  target: string
  progress: AnalyzeProgress | null
  elapsedSeconds: number
}) {
  const currentIndex = progress ? STAGES.findIndex((stage) => stage.key === progress.stage) : 0

  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <div className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin text-emerald-400" aria-hidden="true" />
            <CardTitle>Review in progress</CardTitle>
          </div>
          <p className="mt-1.5 font-mono text-[11px] text-emerald-300/80">{target}</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-md border border-line-strong bg-white/[0.03] px-2 py-1 text-[11px] tabular-nums text-slate-400">
          <Timer className="size-3" />
          {formatElapsed(elapsedSeconds)}
        </div>
      </CardHeader>

      <CardBody className="pt-4">
        <p className="text-xs leading-relaxed text-slate-400">
          {progress?.message ?? 'Starting the review…'}
        </p>

        <ol className="mt-5 space-y-3">
          {STAGES.map((stage, index) => {
            const complete = index < currentIndex
            const active = index === currentIndex
            const pending = index > currentIndex

            return (
              <li key={stage.key} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      'flex size-6 items-center justify-center rounded-full border text-[10px]',
                      complete
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : active
                          ? 'border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-300'
                          : 'border-line-strong bg-white/[0.02] text-slate-600',
                    )}
                  >
                    {complete ? (
                      <Check className="size-3" />
                    ) : active ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  {index < STAGES.length - 1 ? (
                    <span
                      className={cn('mt-1 h-full w-px', complete ? 'bg-emerald-500/30' : 'bg-line')}
                    />
                  ) : null}
                </div>
                <div className={cn('pb-2', pending && 'opacity-45')}>
                  <p className="text-xs font-medium text-slate-200">{stage.label}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                    {stage.description}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>

        <Alert variant="info" className="mt-4">
          Scans run synchronously on the backend. Large pull requests can take several minutes.
          Keep this tab open until the review completes.
        </Alert>
      </CardBody>
    </Card>
  )
}
