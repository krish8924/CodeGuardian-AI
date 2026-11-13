import { ArrowRight, GitPullRequest, ScanSearch, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { useBackendStatus } from '@/hooks/useBackendStatus'

const STEPS = [
  {
    icon: GitPullRequest,
    title: 'Choose a pull request',
    description: 'Enter the GitHub owner, repository and PR number.',
  },
  {
    icon: ScanSearch,
    title: 'Run the scanners',
    description: 'Semgrep, Bandit and Gitleaks analyse changed files.',
  },
  {
    icon: ShieldCheck,
    title: 'Review findings',
    description: 'Filter, expand and inspect evidence with source context.',
  },
]

export function QuickStartCard() {
  const navigate = useNavigate()
  const { health } = useBackendStatus()

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <CardHeader>
        <div>
          <CardTitle>Start a security review</CardTitle>
          <CardDescription>
            The workspace connects directly to the existing FastAPI review pipeline.
          </CardDescription>
        </div>
      </CardHeader>
      <CardBody className="flex flex-1 flex-col pt-4">
        <ol className="space-y-3.5">
          {STEPS.map((step, index) => {
            const Icon = step.icon
            return (
              <li key={step.title} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="flex size-7 items-center justify-center rounded-md border border-line-strong bg-white/[0.03] text-slate-400">
                    <Icon className="size-3.5" aria-hidden="true" />
                  </span>
                  {index < STEPS.length - 1 ? (
                    <span className="mt-1 h-full w-px bg-line" aria-hidden="true" />
                  ) : null}
                </div>
                <div className="pb-1">
                  <p className="text-xs font-medium text-slate-200">{step.title}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                    {step.description}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>

        <div className="mt-auto pt-5">
          <Button
            className="w-full"
            rightIcon={<ArrowRight className="size-3.5" />}
            onClick={() => navigate('/workspace')}
          >
            Open workspace
          </Button>
          <p className="mt-2 text-center text-[10px] text-slate-600">
            {health === 'online'
              ? 'Backend connected and ready.'
              : health === 'offline'
                ? 'Backend offline — start FastAPI before submitting.'
                : 'Checking backend connection…'}
          </p>
        </div>
      </CardBody>
    </Card>
  )
}
