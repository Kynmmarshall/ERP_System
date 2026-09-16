import { ShieldX } from 'lucide-react'

import { ROLE_LABELS } from '@/features/auth/roles'
import type { Role } from '@/types/auth'

/** Shown when the signed-in role is genuinely NOT permitted to see a screen.
 * Deliberately distinct from an "not built yet" empty state: conflating the
 * two would tell a permitted user they were denied, or vice versa. */
export function AccessDenied({ role, requires }: { role?: Role | null; requires: readonly Role[] }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-10 text-center"
    >
      <ShieldX className="size-6 text-warning" aria-hidden="true" />
      <div>
        <p className="text-sm font-medium text-text">You do not have access to this area</p>
        <p className="mt-1 text-sm text-muted">
          {role ? `Your role is ${ROLE_LABELS[role]}.` : null} This area is limited to{' '}
          {requires.map((r) => ROLE_LABELS[r]).join(', ')}. Contact an administrator if you believe
          this is wrong.
        </p>
      </div>
    </div>
  )
}
