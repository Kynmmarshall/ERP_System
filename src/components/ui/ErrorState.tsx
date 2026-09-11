import { AlertTriangle } from 'lucide-react'

export function ErrorState({
  title = 'Something went wrong',
  message,
  action,
}: {
  title?: string
  message: string
  action?: React.ReactNode
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-lg border border-error/30 bg-error/5 px-6 py-10 text-center"
    >
      <AlertTriangle className="size-6 text-error" aria-hidden="true" />
      <div>
        <p className="text-sm font-medium text-text">{title}</p>
        <p className="mt-1 text-sm text-muted">{message}</p>
      </div>
      {action}
    </div>
  )
}
