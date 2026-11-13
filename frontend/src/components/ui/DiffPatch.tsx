import { FileCode2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Badge } from '@/components/ui/Badge'

function patchLineClass(line: string): string {
  if (line.startsWith('+++') || line.startsWith('---')) return 'text-slate-500'
  if (line.startsWith('@@')) return 'bg-sky-500/[0.06] text-sky-300'
  if (line.startsWith('+')) return 'bg-emerald-500/[0.08] text-emerald-300'
  if (line.startsWith('-')) return 'bg-rose-500/[0.08] text-rose-300'
  if (line.startsWith('diff ') || line.startsWith('index ')) return 'text-slate-500'
  return 'text-slate-400'
}

export function DiffPatch({
  patch,
  filename,
  showHeader = true,
}: {
  patch: string | null
  filename: string
  showHeader?: boolean
}) {
  if (!patch) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-line px-4 py-5 text-xs text-slate-500">
        <FileCode2 className="size-4" />
        GitHub did not return a text patch for this file (it may be binary or too large).
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line">
      {showHeader ? (
        <div className="flex items-center gap-2 border-b border-line bg-white/[0.02] px-3 py-2">
          <FileCode2 className="size-3.5 text-slate-500" />
          <span className="truncate font-mono text-[11px] text-slate-300">{filename}</span>
        </div>
      ) : null}
      <div className="max-h-[420px] overflow-auto bg-canvas/80">
        <pre className="min-w-full w-max py-2 font-mono text-[11.5px] leading-5">
          {patch.split('\n').map((line, index) => (
            <div key={index} className={cn('whitespace-pre px-3', patchLineClass(line))}>
              {line || ' '}
            </div>
          ))}
        </pre>
      </div>
    </div>
  )
}

export function FileStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase()

  const variant =
    normalized === 'added'
      ? 'accent'
      : normalized === 'removed'
        ? 'danger'
        : normalized === 'renamed'
          ? 'warning'
          : 'neutral'

  return (
    <Badge variant={variant} className="capitalize">
      {status}
    </Badge>
  )
}
