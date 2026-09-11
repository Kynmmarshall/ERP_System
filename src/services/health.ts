export type ServiceHealth = {
  status: string
  service: string
}

export type ServiceKey = 'gateway' | 'auth' | 'academic' | 'finance' | 'hr'

const HEALTH_PATHS: Record<ServiceKey, string> = {
  gateway: '/healthz',
  auth: '/api/v1/auth/healthz',
  academic: '/api/v1/academic/healthz',
  finance: '/api/v1/finance/healthz',
  hr: '/api/v1/hr/healthz',
}

/**
 * Calls a service's liveness endpoint through the gateway (same-origin, no
 * CORS). Throws on non-2xx so TanStack Query surfaces it as a real error
 * state rather than silently rendering stale/fake data.
 */
export async function fetchServiceHealth(key: ServiceKey): Promise<ServiceHealth> {
  const response = await fetch(HEALTH_PATHS[key])
  if (!response.ok) {
    throw new Error(`${key} health check failed with status ${response.status}`)
  }
  if (key === 'gateway') {
    return { status: 'ok', service: 'gateway' }
  }
  return (await response.json()) as ServiceHealth
}

export const SERVICE_KEYS: ServiceKey[] = ['gateway', 'auth', 'academic', 'finance', 'hr']
