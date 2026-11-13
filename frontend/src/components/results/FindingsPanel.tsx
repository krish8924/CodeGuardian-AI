import { useCallback, useMemo, useState } from 'react'
import { FilterX, Search, ShieldCheck } from 'lucide-react'
import { FindingCard } from '@/components/results/FindingCard'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { api } from '@/services/api'
import type { SecurityFinding, SeverityKey, SourceContentResponse } from '@/types/api'
import { cn } from '@/utils/cn'
import { countByCategory, countByTool, findingTool } from '@/utils/findings'
import { getErrorMessage } from '@/utils/format'
import {
  normalizeSeverity,
  SEVERITY_ORDER,
  severityMeta,
  sortFindingsBySeverity,
} from '@/utils/severity'

type SeverityFilter = 'all' | SeverityKey

const SEVERITY_FILTERS: Array<{ key: SeverityFilter; label: string }> = [
  { key: 'all', label: 'All' },
  ...SEVERITY_ORDER.filter((severity) => severity !== 'unknown').map((severity) => ({
    key: severity,
    label: severityMeta(severity).label,
  })),
]

export function FindingsPanel({
  findings,
  owner,
  repo,
  prNumber,
}: {
  findings: SecurityFinding[]
  owner: string
  repo: string
  prNumber: number
}) {
  const [query, setQuery] = useState('')
  const [severity, setSeverity] = useState<SeverityFilter>('all')
  const [tool, setTool] = useState('all')
  const [category, setCategory] = useState('all')

  const [sourceContent, setSourceContent] = useState<SourceContentResponse | null>(null)
  const [sourceLoading, setSourceLoading] = useState(false)
  const [sourceError, setSourceError] = useState<string | null>(null)

  const tools = useMemo(() => countByTool(findings), [findings])
  const categories = useMemo(() => countByCategory(findings), [findings])

  const filtered = useMemo(() => {
    const lowered = query.trim().toLowerCase()

    return sortFindingsBySeverity(
      findings.filter((finding) => {
        if (severity !== 'all' && normalizeSeverity(finding.severity) !== severity) return false
        if (tool !== 'all' && findingTool(finding) !== tool) return false
        if (category !== 'all' && (finding.category?.trim() || 'uncategorized') !== category) {
          return false
        }

        if (!lowered) return true

        const haystack = [
          finding.title,
          finding.message,
          finding.file,
          finding.tool,
          finding.cwe,
          finding.rule_id,
          finding.category,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return haystack.includes(lowered)
      }),
    )
  }, [category, findings, query, severity, tool])

  const loadSource = useCallback(async () => {
    if (sourceContent || sourceLoading) return

    setSourceLoading(true)
    setSourceError(null)

    try {
      const content = await api.getSourceContent(owner, repo, prNumber)
      setSourceContent(content)
    } catch (error) {
      setSourceError(getErrorMessage(error))
    } finally {
      setSourceLoading(false)
    }
  }, [owner, prNumber, repo, sourceContent, sourceLoading])

  function resetFilters() {
    setQuery('')
    setSeverity('all')
    setTool('all')
    setCategory('all')
  }

  const hasFilters = Boolean(query || severity !== 'all' || tool !== 'all' || category !== 'all')

  if (findings.length === 0) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="No scanner findings"
        description="The backend completed the review and returned zero findings for this pull request. This is a clean scanner result, not a failed request."
        className="py-16"
      />
    )
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2.5 rounded-xl border border-line bg-panel/70 p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search findings, files, rules…"
              leadingIcon={<Search className="size-4" />}
              aria-label="Search findings"
            />
          </div>
          {hasFilters ? (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<FilterX className="size-3.5" />}
              onClick={resetFilters}
              className="self-start sm:self-auto"
            >
              Reset filters
            </Button>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1">
            {SEVERITY_FILTERS.map((option) => {
              const active = severity === option.key
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setSeverity(option.key)}
                  aria-pressed={active}
                  className={cn(
                    'rounded-md border px-2 py-1.5 text-[10px] font-medium transition-colors',
                    active
                      ? 'border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-300'
                      : 'border-line bg-white/[0.02] text-slate-500 hover:bg-white/[0.04] hover:text-slate-300',
                  )}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={tool}
              onChange={(event) => setTool(event.target.value)}
              aria-label="Filter by scanner"
              className="w-[132px]"
            >
              <option value="all">All scanners</option>
              {tools.map((entry) => (
                <option key={entry.tool} value={entry.tool}>
                  {entry.tool} ({entry.count})
                </option>
              ))}
            </Select>
            <Select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              aria-label="Filter by category"
              className="w-[138px]"
            >
              <option value="all">All categories</option>
              {categories.map((entry) => (
                <option key={entry.category} value={entry.category}>
                  {entry.category} ({entry.count})
                </option>
              ))}
            </Select>
          </div>
        </div>
        <p className="text-[10px] text-slate-600">
          Showing {filtered.length} of {findings.length} findings. Sorted by severity, then file
          and line.
        </p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No findings match these filters"
          description="Adjust the search term, severity, scanner or category filters."
          action={
            <Button variant="secondary" size="sm" onClick={resetFilters}>
              Clear filters
            </Button>
          }
          className="py-12"
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((finding, index) => (
            <FindingCard
              key={`${finding.tool ?? 'tool'}-${finding.file ?? 'file'}-${finding.line ?? index}-${index}`}
              finding={finding}
              sourceContent={sourceContent}
              sourceLoading={sourceLoading}
              sourceError={sourceError}
              onLoadSource={() => void loadSource()}
            />
          ))}
        </div>
      )}
    </div>
  )
}
