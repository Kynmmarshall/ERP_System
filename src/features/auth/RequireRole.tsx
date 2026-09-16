import type { ReactNode } from 'react'

import { AccessDenied } from '@/components/ui/AccessDenied'
import { useAuth } from '@/features/auth/AuthContext'
import { hasRole } from '@/features/auth/roles'
import type { Role } from '@/types/auth'

/** Route/section guard. This is UX only - it stops a user wandering into a
 * screen whose every API call would 403 anyway. The real boundary is the
 * backend's require_roles on each endpoint. */
export function RequireRole({ allowed, children }: { allowed: readonly Role[]; children: ReactNode }) {
  const { principal } = useAuth()

  if (!hasRole(principal?.role, allowed)) {
    return <AccessDenied role={principal?.role} requires={allowed} />
  }

  return <>{children}</>
}
