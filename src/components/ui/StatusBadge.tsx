import { CheckCircle2, LoaderCircle, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'

type Status = 'loading' | 'ok' | 'error'

const STATUS_STYLES: Record<Status, { icon: ReactNode; label: string; className: string }> = {
  loading: {
    icon: <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />,
    label: 'Checking…',
    className: 'text-muted border-border bg-surface-elevated/50',
  },
  ok: {
    icon: <CheckCircle2 className="size-4" aria-hidden="true" />,
    label: 'Online',
    className: 'text-success border-success/30 bg-success/10',
  },
  error: {
    icon: <XCircle className="size-4" aria-hidden="true" />,
    label: 'Unreachable',
    className: 'text-error border-error/30 bg-error/10',
  },
}

export function StatusBadge({ status }: { status: Status }) {
  const { icon, label, className } = STATUS_STYLES[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}
    >
      {icon}
      {label}
    </span>
  )
}
