import { GitPullRequest, Info, Play, Search } from 'lucide-react'
import type { FormEvent } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { FormField, Input } from '@/components/ui/Input'

export type TargetField = 'owner' | 'repo' | 'prNumber'
export type TargetErrors = Partial<Record<TargetField, string>>

interface PullRequestFormProps {
  owner: string
  repo: string
  prNumber: string
  errors: TargetErrors
  analyzing: boolean
  previewLoading: boolean
  onOwnerChange: (value: string) => void
  onRepoChange: (value: string) => void
  onPrNumberChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onPreview: () => void
}

export function PullRequestForm({
  owner,
  repo,
  prNumber,
  errors,
  analyzing,
  previewLoading,
  onOwnerChange,
  onRepoChange,
  onPrNumberChange,
  onSubmit,
  onPreview,
}: PullRequestFormProps) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Pull request target</CardTitle>
          <CardDescription>
            The existing API analyses GitHub pull requests. Provide a repository accessible to
            the backend&apos;s GitHub token.
          </CardDescription>
        </div>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-300">
          <GitPullRequest className="size-4" aria-hidden="true" />
        </div>
      </CardHeader>

      <CardBody className="pt-5">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Repository owner" htmlFor="owner" error={errors.owner}>
              <Input
                id="owner"
                value={owner}
                onChange={(event) => onOwnerChange(event.target.value)}
                placeholder="octocat"
                autoComplete="off"
                spellCheck={false}
                disabled={analyzing}
                invalid={Boolean(errors.owner)}
                leadingIcon={<GitPullRequest className="size-4" />}
              />
            </FormField>

            <FormField label="Repository name" htmlFor="repo" error={errors.repo}>
              <Input
                id="repo"
                value={repo}
                onChange={(event) => onRepoChange(event.target.value)}
                placeholder="hello-world"
                autoComplete="off"
                spellCheck={false}
                disabled={analyzing}
                invalid={Boolean(errors.repo)}
              />
            </FormField>
          </div>

          <FormField
            label="Pull request number"
            htmlFor="prNumber"
            error={errors.prNumber}
            hint="Only open, synchronize and reopened events are scanned by the webhook flow. This manual endpoint works for any accessible PR."
          >
            <Input
              id="prNumber"
              value={prNumber}
              onChange={(event) => onPrNumberChange(event.target.value.replace(/[^0-9]/g, ''))}
              placeholder="42"
              inputMode="numeric"
              autoComplete="off"
              disabled={analyzing}
              invalid={Boolean(errors.prNumber)}
            />
          </FormField>

          <Alert variant="info" title="Source-code submission is not supported">
            The current FastAPI backend has no endpoint for pasting arbitrary source code. Reviews
            use GitHub pull requests only, and the language is detected from each changed file.
          </Alert>

          <div className="flex flex-col gap-2 pt-1 sm:flex-row">
            <Button
              type="submit"
              loading={analyzing}
              leftIcon={<Play className="size-3.5" />}
              className="flex-1"
              disabled={previewLoading}
            >
              {analyzing ? 'Running security review…' : 'Run security review'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              loading={previewLoading}
              leftIcon={<Search className="size-3.5" />}
              onClick={onPreview}
              disabled={analyzing}
              className="sm:w-auto"
            >
              Preview pull request
            </Button>
          </div>
        </form>

        <div className="mt-5 rounded-lg border border-line bg-canvas/50 p-3.5">
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-300">
            <Info className="size-3.5 text-emerald-400" />
            What runs on the backend
          </div>
          <ul className="mt-2 space-y-1.5 text-[11px] text-slate-500">
            <li className="flex items-center gap-2">
              <span className="size-1 rounded-full bg-emerald-400/70" />
              Pull request metadata and changed-file inventory
            </li>
            <li className="flex items-center gap-2">
              <span className="size-1 rounded-full bg-emerald-400/70" />
              Semgrep static analysis, Bandit Python checks and Gitleaks secret detection
            </li>
            <li className="flex items-center gap-2">
              <span className="size-1 rounded-full bg-amber-400/70" />
              Groq explanations are webhook-only and are not returned by this endpoint
            </li>
          </ul>
        </div>
      </CardBody>
    </Card>
  )
}
