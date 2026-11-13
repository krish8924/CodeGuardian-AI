import type { SecurityFinding, SeveritySummary } from '@/types/api'
import { summarizeSeverities } from '@/utils/severity'

export function findingFile(finding: SecurityFinding): string {
  return finding.file?.trim() || 'Unknown file'
}

export function findingLine(finding: SecurityFinding): string {
  if (finding.line === null || finding.line === undefined || finding.line === '') return '—'
  return String(finding.line)
}

export function findingTitle(finding: SecurityFinding): string {
  return finding.title?.trim() || finding.message?.trim() || 'Security finding'
}

export function findingTool(finding: SecurityFinding): string {
  return finding.tool?.trim() || 'Unknown scanner'
}

export function summarizeFindings(findings: SecurityFinding[]): SeveritySummary {
  return summarizeSeverities(findings)
}

export function countByTool(findings: SecurityFinding[]): Array<{ tool: string; count: number }> {
  const counts = new Map<string, number>()

  for (const finding of findings) {
    const tool = findingTool(finding)
    counts.set(tool, (counts.get(tool) ?? 0) + 1)
  }

  return [...counts.entries()]
    .map(([tool, count]) => ({ tool, count }))
    .sort((a, b) => b.count - a.count || a.tool.localeCompare(b.tool))
}

export function countByCategory(
  findings: SecurityFinding[],
): Array<{ category: string; count: number }> {
  const counts = new Map<string, number>()

  for (const finding of findings) {
    const category = finding.category?.trim() || 'uncategorized'
    counts.set(category, (counts.get(category) ?? 0) + 1)
  }

  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category))
}

export function filesWithFindings(findings: SecurityFinding[]): string[] {
  const files = new Set<string>()
  for (const finding of findings) {
    if (finding.file) files.add(finding.file)
  }
  return [...files].sort((a, b) => a.localeCompare(b))
}

/** Matches a scanner's basename-only path against a full repository path. */
export function matchesSourceFile(
  findingFile: string,
  sourceFilename: string,
): boolean {
  const findingName = findingFile.replace(/\\/g, '/').split('/').pop() ?? findingFile
  const sourceName = sourceFilename.replace(/\\/g, '/').split('/').pop() ?? sourceFilename

  return findingName === sourceName || sourceFilename.endsWith(findingFile)
}
