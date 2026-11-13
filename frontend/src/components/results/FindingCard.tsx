import { useState } from 'react'
import {
  ChevronDown,
  Code2,
  Eye,
  EyeOff,
  KeyRound,
  ShieldAlert,
} from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Badge, SeverityBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { CodeViewer } from '@/components/ui/CodeBlock'
import { LoadingBlock } from '@/components/ui/Spinner'
import type { SecurityFinding, SourceContentResponse } from '@/types/api'
import { cn } from '@/utils/cn'
import {
  findingFile,
  findingLine,
  findingTitle,
  findingTool,
  matchesSourceFile,
} from '@/utils/findings'
import { formatNumber } from '@/utils/format'

interface FindingCardProps {
  finding: SecurityFinding
  sourceContent: SourceContentResponse | null
  sourceLoading: boolean
  sourceError: string | null
  onLoadSource: () => void
}

function CodeContext({
  content,
  line,
}: {
  content: string
  line: number | string | null | undefined
}) {
  const lineNumber = Number(line)
  const lines = content.replace(/\r\n/g, '\n').split('\n')

  if (!Number.isFinite(lineNumber) || lineNumber <= 0) {
    return (
      <p className="text-[11px] text-slate-500">
        The scanner did not provide a line number for this finding.
      </p>
    )
  }

  const start = Math.max(1, lineNumber - 6)
  const end = Math.min(lines.length, lineNumber + 6)
  const snippet = lines.slice(start - 1, end).join('\n')

  return (
    <CodeViewer
      title={`Source context · line ${lineNumber}`}
      subtitle={`Lines ${start}–${end}`}
      code={snippet}
      startLine={start}
      highlightLines={[lineNumber]}
      className="max-h-[300px]"
    />
  )
}

export function FindingCard({
  finding,
  sourceContent,
  sourceLoading,
  sourceError,
  onLoadSource,
}: FindingCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [secretRevealed, setSecretRevealed] = useState(false)

  const file = findingFile(finding)
  const line = findingLine(finding)
  const tool = findingTool(finding)
  const title = findingTitle(finding)
  const secret = finding.secret?.trim()
  const sourceFile = sourceContent?.files.find((candidate) =>
    matchesSourceFile(finding.file ?? '', candidate.filename),
  )

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border bg-panel transition-colors',
        expanded ? 'border-line-strong' : 'border-line hover:border-line-strong',
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-start gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-400/50"
        aria-expanded={expanded}
      >
        <div className="mt-0.5 shrink-0">
          <SeverityBadge severity={finding.severity} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium leading-snug text-slate-100">{title}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-slate-500">
            <span className="inline-flex items-center gap-1 rounded border border-line-strong bg-white/[0.03] px-1.5 py-0.5 text-slate-400">
              <ShieldAlert className="size-2.5" />
              {tool}
            </span>
            <span className="font-mono text-slate-400">{file}</span>
            {line !== '—' ? (
              <>
                <span className="text-slate-700">:</span>
                <span className="font-mono">{line}</span>
              </>
            ) : null}
            {finding.category ? (
              <>
                <span className="text-slate-700">·</span>
                <span className="capitalize">{finding.category}</span>
              </>
            ) : null}
            {finding.cwe ? (
              <>
                <span className="text-slate-700">·</span>
                <span className="font-mono">{finding.cwe}</span>
              </>
            ) : null}
          </div>
          {!expanded && finding.message ? (
            <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-slate-500">
              {finding.message}
            </p>
          ) : null}
        </div>

        <ChevronDown
          className={cn(
            'mt-0.5 size-4 shrink-0 text-slate-500 transition-transform',
            expanded && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>

      {expanded ? (
        <div className="space-y-4 border-t border-line px-4 pb-4 pt-3.5">
          {finding.message ? (
            <p className="text-xs leading-relaxed text-slate-400">{finding.message}</p>
          ) : null}

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-lg border border-line bg-canvas/40 p-3 sm:grid-cols-3">
            <div>
              <dt className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                Scanner
              </dt>
              <dd className="mt-0.5 text-[11px] text-slate-300">{tool}</dd>
            </div>
            <div>
              <dt className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                File
              </dt>
              <dd className="mt-0.5 truncate font-mono text-[11px] text-slate-300" title={file}>
                {file}
              </dd>
            </div>
            <div>
              <dt className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                Line
              </dt>
              <dd className="mt-0.5 font-mono text-[11px] text-slate-300">{line}</dd>
            </div>
            {finding.rule_id ? (
              <div>
                <dt className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                  Rule
                </dt>
                <dd className="mt-0.5 truncate font-mono text-[11px] text-slate-300" title={finding.rule_id}>
                  {finding.rule_id}
                </dd>
              </div>
            ) : null}
            {finding.cwe ? (
              <div>
                <dt className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                  CWE
                </dt>
                <dd className="mt-0.5 font-mono text-[11px] text-slate-300">{finding.cwe}</dd>
              </div>
            ) : null}
            {finding.confidence ? (
              <div>
                <dt className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                  Confidence
                </dt>
                <dd className="mt-0.5 text-[11px] capitalize text-slate-300">
                  {finding.confidence.toLowerCase()}
                </dd>
              </div>
            ) : null}
            {finding.category ? (
              <div>
                <dt className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                  Category
                </dt>
                <dd className="mt-0.5 text-[11px] capitalize text-slate-300">{finding.category}</dd>
              </div>
            ) : null}
          </dl>

          {secret ? (
            <div className="rounded-lg border border-rose-500/20 bg-rose-500/[0.04] p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[11px] font-medium text-rose-200">
                  <KeyRound className="size-3.5" />
                  Secret detected
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={secretRevealed ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                  onClick={() => setSecretRevealed((current) => !current)}
                  className="-my-1 h-7 text-rose-300 hover:text-rose-200"
                >
                  {secretRevealed ? 'Hide' : 'Reveal'}
                </Button>
              </div>
              <p className="mt-1.5 break-all rounded border border-rose-500/15 bg-canvas/60 px-2.5 py-2 font-mono text-[11px] text-rose-200/90">
                {secretRevealed ? secret : '•'.repeat(Math.min(Math.max(secret.length, 12), 48))}
              </p>
              <p className="mt-1.5 text-[10px] text-rose-300/60">
                Rotate this credential if it was committed. Values are hidden by default to avoid
                accidental disclosure.
              </p>
            </div>
          ) : null}

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                <Code2 className="size-3" />
                Code context
              </p>
              {!sourceContent && !sourceLoading ? (
                <Button variant="secondary" size="sm" onClick={onLoadSource}>
                  Load source
                </Button>
              ) : null}
            </div>

            {sourceLoading ? <LoadingBlock label="Loading source files…" className="py-6" /> : null}
            {sourceError ? (
              <Alert variant="warning" title="Source context unavailable">
                {sourceError}
              </Alert>
            ) : null}
            {!sourceLoading && !sourceError && sourceFile ? (
              <CodeContext content={sourceFile.content} line={finding.line} />
            ) : null}
            {!sourceLoading && !sourceError && sourceContent && !sourceFile ? (
              <p className="rounded-lg border border-dashed border-line px-3 py-4 text-[11px] text-slate-500">
                No source file matched <span className="font-mono">{finding.file}</span> in the
                response from the `/content` endpoint.
              </p>
            ) : null}
            {!sourceLoading && !sourceError && !sourceContent ? (
              <p className="rounded-lg border border-dashed border-line px-3 py-4 text-[11px] text-slate-500">
                Load the PR source files from the backend to see the surrounding code at line{' '}
                {line !== '—' ? line : '(unknown)'}.
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3 text-[10px] text-slate-600">
            <Badge variant="neutral">{tool}</Badge>
            {sourceContent ? (
              <span>{formatNumber(sourceContent.files.length)} source files loaded</span>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
