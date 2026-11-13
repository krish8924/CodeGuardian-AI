import { Bug, KeyRound, ScanSearch, Sparkles, Wrench } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { SecurityFinding } from '@/types/api'
import { countByTool } from '@/utils/findings'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'

interface ScannerDefinition {
  name: string
  description: string
  icon: LucideIcon
  tone: string
}

const SCANNERS: ScannerDefinition[] = [
  {
    name: 'Semgrep',
    description: 'Multi-language static analysis and security rules.',
    icon: ScanSearch,
    tone: 'border-sky-400/20 bg-sky-400/[0.06] text-sky-300',
  },
  {
    name: 'Bandit',
    description: 'Python-specific security issue detection.',
    icon: Bug,
    tone: 'border-amber-400/20 bg-amber-400/[0.06] text-amber-300',
  },
  {
    name: 'Gitleaks',
    description: 'Hardcoded secrets and credential detection.',
    icon: KeyRound,
    tone: 'border-rose-400/20 bg-rose-400/[0.06] text-rose-300',
  },
]

export function ScannerCoverage({ findings }: { findings: SecurityFinding[] }) {
  const byTool = countByTool(findings)
  const counts = new Map(byTool.map((entry) => [entry.tool.toLowerCase(), entry.count]))

  return (
    <div>
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-slate-100">Analysis coverage</h2>
          <p className="mt-1 text-xs text-slate-500">
            Scanners executed by the FastAPI backend on each pull request review.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-600">
          <Wrench className="size-3" />
          Engine v1.0.0
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {SCANNERS.map((scanner) => {
          const Icon = scanner.icon
          const count = counts.get(scanner.name.toLowerCase()) ?? 0

          return (
            <Card key={scanner.name} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className={`flex size-8 items-center justify-center rounded-lg border ${scanner.tone}`}>
                  <Icon className="size-4" aria-hidden="true" />
                </div>
                <span className="text-[10px] tabular-nums text-slate-500">
                  {count} {count === 1 ? 'finding' : 'findings'}
                </span>
              </div>
              <p className="mt-3 text-xs font-medium text-slate-200">{scanner.name}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                {scanner.description}
              </p>
            </Card>
          )
        })}
      </div>

      <Card className="mt-3 border-dashed bg-white/[0.015] p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-300">
            <Sparkles className="size-4" aria-hidden="true" />
          </div>
          <div>
            <CardHeader className="p-0">
              <CardTitle className="text-xs">Groq AI explanations</CardTitle>
            </CardHeader>
            <CardDescription>
              The backend generates AI explanations inside the GitHub webhook flow and posts them
              to the pull request. The `/security` endpoint only returns raw scanner findings, so
              they are not available in this view.
            </CardDescription>
          </div>
        </div>
      </Card>
    </div>
  )
}
