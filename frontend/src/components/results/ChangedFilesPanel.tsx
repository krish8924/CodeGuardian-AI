import { FileCode2, ShieldAlert } from 'lucide-react'
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { FileStatusBadge } from '@/components/ui/DiffPatch'
import type { ChangedFile, SecurityFinding } from '@/types/api'
import { cn } from '@/utils/cn'
import { matchesSourceFile } from '@/utils/findings'
import { formatNumber, pluralize } from '@/utils/format'

export function ChangedFilesPanel({
  files,
  findings,
}: {
  files: ChangedFile[]
  findings: SecurityFinding[]
}) {
  const additions = files.reduce((sum, file) => sum + file.additions, 0)
  const deletions = files.reduce((sum, file) => sum + file.deletions, 0)

  function findingsForFile(filename: string) {
    return findings.filter((finding) =>
      matchesSourceFile(finding.file ?? '', filename),
    ).length
  }

  if (files.length === 0) {
    return (
      <EmptyState
        icon={FileCode2}
        title="No changed files returned"
        description="The backend's changed-files endpoint returned an empty file list for this pull request."
        className="py-12"
      />
    )
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Changed files</CardTitle>
          <CardDescription>
            {files.length} {pluralize(files.length, 'file')} returned by the GitHub pull request.
          </CardDescription>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-emerald-400">+{formatNumber(additions)}</span>
          <span className="text-rose-400">−{formatNumber(deletions)}</span>
        </div>
      </CardHeader>
      <CardBody className="pt-4">
        <div className="divide-y divide-line/70">
          {files.map((file) => {
            const count = findingsForFile(file.filename)

            return (
              <div
                key={file.filename}
                className="flex flex-col gap-2 py-2.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-3"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <FileCode2 className="size-3.5 shrink-0 text-slate-600" />
                  <span className="truncate font-mono text-[11px] text-slate-300" title={file.filename}>
                    {file.filename}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 pl-5 sm:justify-end sm:pl-0">
                  {count > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded border border-rose-500/20 bg-rose-500/[0.06] px-1.5 py-0.5 text-[10px] text-rose-300">
                      <ShieldAlert className="size-2.5" />
                      {count} {pluralize(count, 'finding')}
                    </span>
                  ) : null}
                  <FileStatusBadge status={file.status} />
                  <span className="w-[72px] text-right font-mono text-[10px] tabular-nums">
                    <span className="text-emerald-400">+{file.additions}</span>{' '}
                    <span className="text-rose-400">−{file.deletions}</span>
                  </span>
                  <span
                    className={cn(
                      'hidden w-[62px] text-right text-[10px] tabular-nums text-slate-600 sm:inline',
                    )}
                  >
                    {file.changes} chg
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </CardBody>
    </Card>
  )
}
