import axios, { type AxiosError } from 'axios'
import type {
  ChangedFile,
  ChangedFilesResponse,
  DiffFile,
  DiffResponse,
  GitHubConnectionResponse,
  HealthResponse,
  PullRequestResponse,
  ReviewRecord,
  ReviewStage,
  SecurityFinding,
  SecurityScanResponse,
  SourceContentResponse,
  SourceFile,
} from '@/types/api'

/**
 * In development the browser calls `/api`, which Vite proxies to FastAPI.
 * Set `VITE_API_PATH` to an absolute backend URL if the deployment enables
 * CORS and does not use a reverse proxy.
 */
const configuredApiPath = (import.meta.env.VITE_API_PATH as string | undefined)?.trim()
export const API_BASE_URL = (configuredApiPath || '/api').replace(/\/+$/, '')

export const DEFAULT_TIMEOUT_MS = 30_000
export const SCAN_TIMEOUT_MS = 10 * 60 * 1000

export class ApiError extends Error {
  readonly status?: number
  readonly isNetworkError: boolean
  readonly isTimeout: boolean

  constructor(
    message: string,
    options: { status?: number; isNetworkError?: boolean; isTimeout?: boolean } = {},
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = options.status
    this.isNetworkError = options.isNetworkError ?? false
    this.isTimeout = options.isTimeout ?? false
  }
}

function extractDetail(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined

  const detail = (data as Record<string, unknown>).detail

  if (typeof detail === 'string') return detail

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (item && typeof item === 'object') {
          const message = (item as Record<string, unknown>).msg
          if (typeof message === 'string') return message
        }
        return typeof item === 'string' ? item : null
      })
      .filter((item): item is string => Boolean(item))

    if (messages.length > 0) return messages.join(' • ')
  }

  if (detail && typeof detail === 'object') {
    try {
      return JSON.stringify(detail)
    } catch {
      return undefined
    }
  }

  return undefined
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (axios.isCancel(error)) {
    return new ApiError('The request was cancelled.', { isNetworkError: true })
  }

  const axiosError = error as AxiosError<unknown>
  const status = axiosError.response?.status
  const detail = extractDetail(axiosError.response?.data)

  if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
    return new ApiError(
      'The backend took too long to respond. Large pull requests and scanner runs can be slow — try again or check the FastAPI logs.',
      { status, isTimeout: true },
    )
  }

  if (!axiosError.response) {
    return new ApiError(
      `Could not reach the CodeGuardian AI backend. Make sure FastAPI is running and VITE_API_BASE_URL points to it (current API path: ${API_BASE_URL}).`,
      { isNetworkError: true },
    )
  }

  const fallback =
    status === 401
      ? 'The backend rejected the request. Check the GitHub webhook signature configuration for webhook requests.'
      : status === 404
        ? 'The requested resource was not found. Verify the repository owner, name and pull request number.'
        : `The backend returned an error (HTTP ${status ?? 'unknown'}).`

  return new ApiError(detail || fallback, { status })
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT_MS,
  headers: { Accept: 'application/json' },
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(toApiError(error)),
)

type JsonObject = Record<string, unknown>

function assertObject(value: unknown, context: string): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError(`Unexpected response format while reading ${context}.`)
  }
  return value as JsonObject
}

function asString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return fallback
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function asNullableString(value: unknown): string | null {
  if (typeof value === 'string' && value.length > 0) return value
  if (typeof value === 'number') return String(value)
  return null
}

function asNullableNumberOrString(value: unknown): number | string | null {
  if (typeof value === 'number' || typeof value === 'string') return value
  return null
}

function parsePullRequest(data: unknown): PullRequestResponse {
  const value = assertObject(data, 'the pull request')

  return {
    number: asNumber(value.number),
    title: asString(value.title, 'Untitled pull request'),
    state: asString(value.state, 'unknown'),
    author: asString(value.author, 'unknown'),
    source_branch: asString(value.source_branch, 'unknown'),
    target_branch: asString(value.target_branch, 'unknown'),
  }
}

function parseChangedFile(value: unknown): ChangedFile {
  const file = assertObject(value, 'a changed file')

  return {
    filename: asString(file.filename, 'unknown-file'),
    status: asString(file.status, 'modified'),
    additions: asNumber(file.additions),
    deletions: asNumber(file.deletions),
    changes: asNumber(file.changes),
  }
}

function parseChangedFiles(data: unknown, prNumber: number): ChangedFilesResponse {
  const value = assertObject(data, 'the changed files')
  const files = Array.isArray(value.files) ? value.files.map(parseChangedFile) : []

  return {
    pr_number: asNumber(value.pr_number, prNumber),
    total_files: asNumber(value.total_files, files.length),
    files,
  }
}

function parseDiffFile(value: unknown): DiffFile {
  const file = assertObject(value, 'a diff file')

  return {
    filename: asString(file.filename, 'unknown-file'),
    status: asString(file.status, 'modified'),
    patch: typeof file.patch === 'string' ? file.patch : null,
  }
}

function parseDiff(data: unknown, prNumber: number): DiffResponse {
  const value = assertObject(data, 'the pull request diff')
  const files = Array.isArray(value.files) ? value.files.map(parseDiffFile) : []

  return {
    pr_number: asNumber(value.pr_number, prNumber),
    total_files: asNumber(value.total_files, files.length),
    files,
  }
}

function parseFinding(value: unknown): SecurityFinding {
  const finding = assertObject(value, 'a security finding')

  return {
    tool: asNullableString(finding.tool),
    file: asNullableString(finding.file),
    line: asNullableNumberOrString(finding.line),
    severity: asNullableString(finding.severity),
    category: asNullableString(finding.category),
    title: asNullableString(finding.title),
    message: asNullableString(finding.message),
    cwe: asNullableString(finding.cwe),
    rule_id: asNullableString(finding.rule_id),
    confidence: asNullableString(finding.confidence),
    secret: asNullableString(finding.secret),
  }
}

function parseSecurityScan(data: unknown, prNumber: number): SecurityScanResponse {
  const value = assertObject(data, 'the security scan')

  if (!Array.isArray(value.findings)) {
    throw new ApiError(
      'The security endpoint returned an unexpected response: the findings list is missing.',
    )
  }

  const findings = value.findings.map(parseFinding)

  return {
    status: asString(value.status, 'success'),
    pr_number: asNumber(value.pr_number, prNumber),
    total_findings: asNumber(value.total_findings, findings.length),
    findings,
  }
}

function parseSourceFile(value: unknown): SourceFile {
  const file = assertObject(value, 'a source file')

  return {
    filename: asString(file.filename, 'unknown-file'),
    status: asString(file.status, 'modified'),
    language: asString(file.language, 'Unknown'),
    content: asString(file.content),
  }
}

function parseSourceContent(data: unknown, prNumber: number): SourceContentResponse {
  const value = assertObject(data, 'the pull request source files')
  const files = Array.isArray(value.files) ? value.files.map(parseSourceFile) : []

  return {
    pr_number: asNumber(value.pr_number, prNumber),
    total_files: asNumber(value.total_files, files.length),
    files,
  }
}

function encodedRepoPath(owner: string, repo: string, prNumber: number): string {
  return `/github/pr/${encodeURIComponent(owner.trim())}/${encodeURIComponent(
    repo.trim(),
  )}/${encodeURIComponent(String(prNumber))}`
}

export const api = {
  async health(): Promise<HealthResponse> {
    const response = await apiClient.get<unknown>('/health')
    const value = assertObject(response.data, 'the health check')
    return { status: asString(value.status, 'unknown') }
  },

  async githubTest(): Promise<GitHubConnectionResponse> {
    const response = await apiClient.get<unknown>('/github/test')
    const value = assertObject(response.data, 'the GitHub connection')
    return {
      status: asString(value.status, 'unknown'),
      github_username: asString(value.github_username, 'unknown'),
    }
  },

  async getPullRequest(owner: string, repo: string, prNumber: number): Promise<PullRequestResponse> {
    const response = await apiClient.get<unknown>(encodedRepoPath(owner, repo, prNumber))
    return parsePullRequest(response.data)
  },

  async getChangedFiles(owner: string, repo: string, prNumber: number): Promise<ChangedFilesResponse> {
    const response = await apiClient.get<unknown>(
      `${encodedRepoPath(owner, repo, prNumber)}/files`,
    )
    return parseChangedFiles(response.data, prNumber)
  },

  async getDiff(owner: string, repo: string, prNumber: number): Promise<DiffResponse> {
    const response = await apiClient.get<unknown>(
      `${encodedRepoPath(owner, repo, prNumber)}/diff`,
      { timeout: SCAN_TIMEOUT_MS },
    )
    return parseDiff(response.data, prNumber)
  },

  async getSourceContent(
    owner: string,
    repo: string,
    prNumber: number,
  ): Promise<SourceContentResponse> {
    const response = await apiClient.get<unknown>(
      `${encodedRepoPath(owner, repo, prNumber)}/content`,
      { timeout: SCAN_TIMEOUT_MS },
    )
    return parseSourceContent(response.data, prNumber)
  },

  async getSecurityScan(
    owner: string,
    repo: string,
    prNumber: number,
  ): Promise<SecurityScanResponse> {
    const response = await apiClient.get<unknown>(
      `${encodedRepoPath(owner, repo, prNumber)}/security`,
      { timeout: SCAN_TIMEOUT_MS },
    )
    return parseSecurityScan(response.data, prNumber)
  },

  /**
   * Diagnostics against the backend's bundled scanner test fixtures.
   * These are the only non-GitHub analysis endpoints the backend exposes.
   */
  async runSemgrepSelfTest(): Promise<number> {
    const response = await apiClient.get<unknown>('/security/semgrep-test', {
      timeout: SCAN_TIMEOUT_MS,
    })
    const value = assertObject(response.data, 'the Semgrep self-test')
    const results = value.results

    if (!results || typeof results !== 'object') return 0

    const rawResults = (results as JsonObject).results
    return Array.isArray(rawResults) ? rawResults.length : 0
  },

  async runBanditSelfTest(): Promise<number> {
    const response = await apiClient.get<unknown>('/security/bandit-test', {
      timeout: SCAN_TIMEOUT_MS,
    })
    const value = assertObject(response.data, 'the Bandit self-test')
    const results = value.results

    if (!results || typeof results !== 'object') return 0

    const rawResults = (results as JsonObject).results
    return Array.isArray(rawResults) ? rawResults.length : 0
  },
}

export function reviewId(owner: string, repo: string, prNumber: number): string {
  return `${owner.trim().toLowerCase()}/${repo.trim().toLowerCase()}/${prNumber}`
}

export interface AnalyzeProgress {
  stage: ReviewStage
  message: string
}

export async function analyzePullRequest(
  owner: string,
  repo: string,
  prNumber: number,
  onProgress?: (progress: AnalyzeProgress) => void,
): Promise<ReviewRecord> {
  onProgress?.({
    stage: 'preparing',
    message: 'Fetching pull request details and changed files',
  })

  const [pullRequest, changedFiles] = await Promise.all([
    api.getPullRequest(owner, repo, prNumber),
    api.getChangedFiles(owner, repo, prNumber),
  ])

  onProgress?.({
    stage: 'scanning',
    message: 'Running Semgrep, Bandit and Gitleaks against the pull request',
  })

  const security = await api.getSecurityScan(owner, repo, prNumber)

  onProgress?.({
    stage: 'finalizing',
    message: 'Preparing the findings report',
  })

  return {
    version: 1,
    id: reviewId(owner, repo, prNumber),
    owner: owner.trim(),
    repo: repo.trim(),
    prNumber,
    analyzedAt: new Date().toISOString(),
    pullRequest: {
      ...pullRequest,
      number: pullRequest.number || prNumber,
    },
    files: changedFiles.files,
    findings: security.findings,
    totalFindings: security.total_findings || security.findings.length,
  }
}
