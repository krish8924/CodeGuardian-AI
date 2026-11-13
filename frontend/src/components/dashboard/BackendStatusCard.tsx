import { CheckCircle2, CircleDashed, RefreshCw, Server, ShieldAlert, Sparkles, XCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { useBackendStatus, type ConnectionState } from '@/hooks/useBackendStatus'
import { API_BASE_URL } from '@/services/api'
import { cn } from '@/utils/cn'
import { formatRelativeTime } from '@/utils/format'

function StatusIcon({ state }: { state: ConnectionState }) {
  if (state === 'online') {
    return <CheckCircle2 className="size-4 text-emerald-400" aria-hidden="true" />
  }
  if (state === 'offline') {
    return <XCircle className="size-4 text-rose-400" aria-hidden="true" />
  }
  return <CircleDashed className="size-4 animate-spin text-amber-300" aria-hidden="true" />
}

function StatusRow({
  icon: Icon,
  label,
  state,
  detail,
  tone = 'default',
}: {
  icon: LucideIcon
  label: string
  state?: ConnectionState
  detail: string
  tone?: 'default' | 'accent' | 'muted'
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div
        className={cn(
          'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border',
          tone === 'accent'
            ? 'border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-300'
            : tone === 'muted'
              ? 'border-line bg-white/[0.02] text-slate-500'
              : 'border-line-strong bg-white/[0.03] text-slate-400',
        )}
      >
        <Icon className="size-3.5" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-slate-300">{label}</p>
          {state ? <StatusIcon state={state} /> : null}
        </div>
        <p className="mt-0.5 break-words text-[11px] leading-relaxed text-slate-500">{detail}</p>
      </div>
    </div>
  )
}

export function BackendStatusCard() {
  const {
    health,
    healthData,
    healthError,
    github,
    githubData,
    githubError,
    lastChecked,
    refresh,
  } = useBackendStatus()

  const healthDetail =
    health === 'online'
      ? `Responded with "${healthData?.status ?? 'healthy'}".`
      : health === 'offline'
        ? (healthError ?? 'No response from the health endpoint.')
        : 'Calling the /health endpoint…'

  const githubDetail =
    github === 'online'
      ? `Authenticated as @${githubData?.github_username ?? 'unknown'}.`
      : github === 'offline'
        ? githubError && /bad credentials/i.test(githubError)
          ? 'GitHub rejected the backend token (bad credentials). Update GITHUB_TOKEN and restart FastAPI.'
          : (githubError ?? 'GitHub authentication failed.')
        : 'Checking the backend GitHub token…'

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div>
          <CardTitle>System status</CardTitle>
          <CardDescription>Live checks against the FastAPI backend.</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => void refresh()}
          aria-label="Refresh system status"
          className="-mr-1 -mt-1"
        >
          <RefreshCw className="size-3.5" />
        </Button>
      </CardHeader>
      <CardBody className="flex-1 pt-2">
        <div className="divide-y divide-line/70">
          <StatusRow
            icon={Server}
            label="Backend API"
            state={health}
            detail={healthDetail}
            tone="accent"
          />
          <StatusRow
            icon={ShieldAlert}
            label="GitHub integration"
            state={github}
            detail={githubDetail}
          />
          <StatusRow
            icon={Sparkles}
            label="Groq AI analysis"
            detail="Generated during GitHub webhook scans and posted as a PR comment. The REST API does not return it."
            tone="muted"
          />
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-line bg-canvas/50 px-3 py-2 text-[10px] text-slate-600">
          <span className="truncate font-mono" title={API_BASE_URL}>
            {API_BASE_URL}
          </span>
          <span className="shrink-0">
            {lastChecked ? `checked ${formatRelativeTime(lastChecked)}` : 'checking…'}
          </span>
        </div>
      </CardBody>
    </Card>
  )
}
