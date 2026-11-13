import { Wrench } from 'lucide-react'
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import type { SecurityFinding } from '@/types/api'
import { countByTool } from '@/utils/findings'

const TOOL_COLORS: Record<string, string> = {
  semgrep: 'bg-sky-400',
  bandit: 'bg-amber-400',
  gitleaks: 'bg-rose-400',
}

export function ToolBreakdown({ findings }: { findings: SecurityFinding[] }) {
  const tools = countByTool(findings)
  const max = Math.max(1, ...tools.map((tool) => tool.count))

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Scanner breakdown</CardTitle>
          <CardDescription>Findings grouped by the tool that reported them.</CardDescription>
        </div>
        <Wrench className="size-4 text-slate-600" />
      </CardHeader>
      <CardBody className="pt-4">
        {tools.length === 0 ? (
          <p className="text-[11px] text-slate-500">
            No scanner findings were returned for this review.
          </p>
        ) : (
          <div className="space-y-3">
            {tools.map((tool) => (
              <div key={tool.tool}>
                <div className="flex items-center justify-between gap-3 text-[11px]">
                  <span className="text-slate-400">{tool.tool}</span>
                  <span className="font-medium tabular-nums text-slate-300">{tool.count}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.04]">
                  <div
                    className={`h-full rounded-full ${TOOL_COLORS[tool.tool.toLowerCase()] ?? 'bg-emerald-400'}`}
                    style={{ width: `${Math.max(8, (tool.count / max) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
