import { useQuery } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

import { StatusBadge } from '@/components/ui/StatusBadge'
import { SERVICE_KEYS, fetchServiceHealth, type ServiceKey } from '@/services/health'

const SERVICE_LABELS: Record<ServiceKey, string> = {
  gateway: 'Gateway',
  auth: 'Identity',
  academic: 'Academic',
  finance: 'Finance & Marketing',
  hr: 'Administration & HR',
}

function ServiceCard({ serviceKey, index }: { serviceKey: ServiceKey; index: number }) {
  const prefersReducedMotion = useReducedMotion()
  const query = useQuery({
    queryKey: ['health', serviceKey],
    queryFn: () => fetchServiceHealth(serviceKey),
  })

  const status = query.isPending ? 'loading' : query.isError ? 'error' : 'ok'

  return (
    <motion.li
      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: prefersReducedMotion ? 0 : index * 0.05 }}
      className="flex items-center justify-between rounded-lg border border-border bg-surface p-4"
    >
      <div>
        <p className="text-sm font-medium text-text">{SERVICE_LABELS[serviceKey]}</p>
        {query.isError ? (
          <p className="mt-1 text-xs text-muted">{(query.error as Error).message}</p>
        ) : null}
      </div>
      <StatusBadge status={status} />
    </motion.li>
  )
}

export function SystemStatusPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
          ICT University ERP
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-text">System status</h1>
        <p className="mt-2 text-sm text-muted">
          Real liveness checks made from this page, through the gateway, to every service.
        </p>
      </header>

      <ul className="flex flex-col gap-3" aria-label="Service health status">
        {SERVICE_KEYS.map((key, index) => (
          <ServiceCard key={key} serviceKey={key} index={index} />
        ))}
      </ul>

      <p className="mt-8 flex items-center gap-2 text-xs text-muted">
        <RefreshCw className="size-3.5" aria-hidden="true" />
        Reload the page to re-check every service.
      </p>
    </main>
  )
}
