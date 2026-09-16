import type { Role } from '@/types/auth'

export const ROLES: readonly Role[] = ['super_admin', 'admin', 'staff', 'student'] as const

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  staff: 'Staff',
  student: 'Student',
}

/** Mirrors the backend's role bands in each service's app/deps.py
 * (require_roles). Kept in one place so a UI guard can never silently drift
 * from the API one - but these are UX only: the API re-checks every request
 * regardless. */
export const ADMIN_ROLES: readonly Role[] = ['admin', 'super_admin'] as const
export const STAFF_ROLES: readonly Role[] = ['staff', 'admin', 'super_admin'] as const

/** Roles an applicant may ask for at sign-up. Super Admin is absent on
 * purpose: it is platform-wide, so it stays grantable only by an existing
 * super admin (the API rejects it here too). */
export const REQUESTABLE_ROLES: readonly Role[] = ['student', 'staff', 'admin'] as const

export function hasRole(role: Role | undefined | null, allowed: readonly Role[]): boolean {
  return role != null && allowed.includes(role)
}
