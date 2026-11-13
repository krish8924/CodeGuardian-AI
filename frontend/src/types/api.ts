/**
 * Types mirror the FastAPI contracts in `backend/main.py`.
 * Optional fields are tolerated because scanner output varies by tool.
 */

export interface HealthResponse {
  status: string
}

export interface GitHubConnectionResponse {
  status: string
  github_username: string
}

export interface PullRequestResponse {
  number: number
  title: string
  state: string
  author: string
  source_branch: string
  target_branch: string
}

export interface ChangedFile {
  filename: string
  status: string
  additions: number
  deletions: number
  changes: number
}

export interface ChangedFilesResponse {
  pr_number: number
  total_files: number
  files: ChangedFile[]
}

export interface DiffFile {
  filename: string
  status: string
  patch: string | null
}

export interface DiffResponse {
  pr_number: number
  total_files: number
  files: DiffFile[]
}

/** Shape returned inside `/github/pr/{owner}/{repo}/{pr}/security`. */
export interface SecurityFinding {
  tool?: string | null
  file?: string | null
  line?: number | string | null
  severity?: string | null
  category?: string | null
  title?: string | null
  message?: string | null
  cwe?: string | null
  rule_id?: string | null
  confidence?: string | null
  secret?: string | null
}

export interface SecurityScanResponse {
  status: string
  pr_number: number
  total_findings: number
  findings: SecurityFinding[]
}

export interface SourceFile {
  filename: string
  status: string
  language: string
  content: string
}

export interface SourceContentResponse {
  pr_number: number
  total_files: number
  files: SourceFile[]
}

/** A completed review persisted in this browser (no backend history API exists). */
export interface ReviewRecord {
  version: 1
  id: string
  owner: string
  repo: string
  prNumber: number
  analyzedAt: string
  pullRequest: PullRequestResponse
  files: ChangedFile[]
  findings: SecurityFinding[]
  totalFindings: number
}

export type SeverityKey =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'info'
  | 'unknown'

export interface SeveritySummary {
  critical: number
  high: number
  medium: number
  low: number
  info: number
  unknown: number
  total: number
}

export type ReviewStage = 'preparing' | 'scanning' | 'finalizing'
