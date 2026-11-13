import type { SeverityKey, SeveritySummary } from '@/types/api'

interface SeverityMeta {
  key: SeverityKey
  label: string
  order: number
  badgeClass: string
  dotClass: string
  textClass: string
  chartColor: string
}

const SEVERITY_META: Record<SeverityKey, SeverityMeta> = {
  critical: {
    key: 'critical',
    label: 'Critical',
    order: 0,
    badgeClass: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
    dotClass: 'bg-rose-400',
    textClass: 'text-rose-300',
    chartColor: '#fb7185',
  },
  high: {
    key: 'high',
    label: 'High',
    order: 1,
    badgeClass: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
    dotClass: 'bg-orange-400',
    textClass: 'text-orange-300',
    chartColor: '#fb923c',
  },
  medium: {
    key: 'medium',
    label: 'Medium',
    order: 2,
    badgeClass: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
    dotClass: 'bg-amber-300',
    textClass: 'text-amber-300',
    chartColor: '#fbbf24',
  },
  low: {
    key: 'low',
    label: 'Low',
    order: 3,
    badgeClass: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
    dotClass: 'bg-sky-400',
    textClass: 'text-sky-300',
    chartColor: '#38bdf8',
  },
  info: {
    key: 'info',
    label: 'Info',
    order: 4,
    badgeClass: 'border-slate-400/30 bg-slate-400/10 text-slate-300',
    dotClass: 'bg-slate-400',
    textClass: 'text-slate-300',
    chartColor: '#94a3b8',
  },
  unknown: {
    key: 'unknown',
    label: 'Unknown',
    order: 5,
    badgeClass: 'border-line-strong bg-white/[0.04] text-slate-400',
    dotClass: 'bg-slate-500',
    textClass: 'text-slate-400',
    chartColor: '#64748b',
  },
}

export const SEVERITY_ORDER: SeverityKey[] = [
  'critical',
  'high',
  'medium',
  'low',
  'info',
  'unknown',
]

export function normalizeSeverity(value: string | null | undefined): SeverityKey {
  const normalized = (value ?? '').trim().toLowerCase()

  if (normalized.includes('critical')) return 'critical'
  if (normalized.includes('high') || normalized === 'error') return 'high'
  if (normalized.includes('medium') || normalized === 'warning') return 'medium'
  if (normalized.includes('low')) return 'low'
  if (normalized.includes('info')) return 'info'
  return 'unknown'
}

export function severityMeta(value: string | null | undefined): SeverityMeta {
  return SEVERITY_META[normalizeSeverity(value)]
}

export function summarizeSeverities(
  findings: Array<{ severity?: string | null }>,
): SeveritySummary {
  const summary: SeveritySummary = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
    unknown: 0,
    total: findings.length,
  }

  for (const finding of findings) {
    summary[normalizeSeverity(finding.severity)] += 1
  }

  return summary
}

export function sortFindingsBySeverity<
  T extends { severity?: string | null; file?: string | null; line?: number | string | null },
>(findings: T[]): T[] {
  return [...findings].sort((a, b) => {
    const severityDelta =
      SEVERITY_META[normalizeSeverity(a.severity)].order -
      SEVERITY_META[normalizeSeverity(b.severity)].order

    if (severityDelta !== 0) return severityDelta

    const fileDelta = (a.file ?? '').localeCompare(b.file ?? '')
    if (fileDelta !== 0) return fileDelta

    return Number(a.line ?? 0) - Number(b.line ?? 0)
  })
}
