export function pullRequestUrl(owner: string, repo: string, prNumber: number): string {
  return `https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pull/${prNumber}`
}

export function repositoryUrl(owner: string, repo: string): string {
  return `https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`
}

export function reviewPath(owner: string, repo: string, prNumber: number): string {
  return `/reviews/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${prNumber}`
}
