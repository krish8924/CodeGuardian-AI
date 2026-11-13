import { ExternalLink, GitPullRequest, Sparkles, XCircle } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import type { ReviewRecord } from '@/types/api'
import { formatDateTime } from '@/utils/format'
import { pullRequestUrl } from '@/utils/github'

export function ReviewNotesPanel({ review }: { review: ReviewRecord }) {
  const url = pullRequestUrl(review.owner, review.repo, review.prNumber)

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader>
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-emerald-400" />
              <CardTitle>AI analysis availability</CardTitle>
            </div>
            <CardDescription>
              Why this report contains scanner findings but no Groq agent responses.
            </CardDescription>
          </div>
          <Badge variant="warning">Webhook only</Badge>
        </CardHeader>
        <CardBody className="pt-4">
          <div className="space-y-3 text-xs leading-relaxed text-slate-400">
            <p>
              The backend runs Groq AI analysis inside <code className="font-mono text-[11px] text-slate-300">process_webhook_security</code> when
              GitHub sends a pull request webhook. It posts the AI summary and recommendations as a
              comment on the pull request.
            </p>
            <p>
              The REST endpoint used by this frontend,{' '}
              <code className="font-mono text-[11px] text-slate-300">/github/pr/{'{owner}'}/{'{repo}'}/{'{pr}'}/security</code>,
              returns only normalised Semgrep, Bandit and Gitleaks findings. It has no fields for
              agent-by-agent output, recommendations, suggested code fixes or a final AI review.
            </p>
            <p>
              Rather than inventing those fields, this page shows exactly what the API returned.
              Open the pull request on GitHub to read any AI comments posted by the webhook.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.06] px-3.5 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-500/10"
            >
              <GitPullRequest className="size-3.5" />
              Open pull request
              <ExternalLink className="size-3" />
            </a>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Not available from the current API</CardTitle>
            <CardDescription>
              These sections are intentionally absent instead of being simulated.
            </CardDescription>
          </div>
        </CardHeader>
        <CardBody className="pt-4">
          <ul className="space-y-2.5 text-[11px] text-slate-500">
            {[
              'Individual AI agent responses and their status',
              'Final AI-generated review text',
              'Groq severity explanations and confidence scores',
              'AI-suggested code fixes or patches',
              'Persistent review history stored by the backend',
              'Direct source-code submission and arbitrary language selection',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <XCircle className="mt-0.5 size-3.5 shrink-0 text-slate-600" />
                {item}
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Review provenance</CardTitle>
            <CardDescription>Data captured from the backend response.</CardDescription>
          </div>
        </CardHeader>
        <CardBody className="pt-4">
          <dl className="space-y-2.5 text-[11px]">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">Analysed at</dt>
              <dd className="text-right text-slate-300">{formatDateTime(review.analyzedAt)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">Pull request</dt>
              <dd className="font-mono text-slate-300">#{review.prNumber}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">Changed files</dt>
              <dd className="tabular-nums text-slate-300">{review.files.length}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">Findings</dt>
              <dd className="tabular-nums text-slate-300">{review.totalFindings}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">Storage</dt>
              <dd className="text-right text-slate-300">Browser localStorage</dd>
            </div>
          </dl>
          <Alert variant="info" className="mt-3">
            Scanner findings are advisory. Verify each issue and suggested fix before merging.
          </Alert>
        </CardBody>
      </Card>
    </div>
  )
}
