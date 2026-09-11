import { Inbox } from 'lucide-react'
import type { ReactNode } from 'react'

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string
  message?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-10 text-center">
      <Inbox className="size-6 text-muted" aria-hidden="true" />
      <div>
        <p className="text-sm font-medium text-text">{title}</p>
        {message ? <p className="mt-1 text-sm text-muted">{message}</p> : null}
      </div>
      {action}
    </div>
  )
}
