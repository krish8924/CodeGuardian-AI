import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export function NotFoundPage() {
  useDocumentTitle('Not Found')

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="404"
        title="Page not found"
        description="The page you requested does not exist in this workspace."
      />
      <EmptyState
        icon={Compass}
        title="Nothing to review here"
        description="Use the dashboard, start a new code review, or browse the reports stored in this browser."
        action={
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link to="/">
              <Button>Back to dashboard</Button>
            </Link>
            <Link to="/workspace">
              <Button variant="secondary">Open workspace</Button>
            </Link>
          </div>
        }
        className="py-20"
      />
    </div>
  )
}
