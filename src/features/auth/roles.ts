import type { Role } from '@/types/auth'

export const ROLES: readonly Role[] = [
  'super_admin',
  'admin',
  'staff',
  'lecturer',
  'finance_staff',
  'student',
] as const

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  staff: 'Staff (all areas)',
  lecturer: 'Lecturer',
  finance_staff: 'Finance Staff',
  student: 'Student',
}

/** Mirrors the backend's role bands in each service's app/deps.py
 * (require_roles). Kept in one place so a UI guard can never silently drift
 * from the API one - but these are UX only: the API re-checks every request
 * regardless. */
export const ADMIN_ROLES: readonly Role[] = ['admin', 'super_admin'] as const

/** Anyone employed by the university - the band HR self-service uses. */
export const STAFF_ROLES: readonly Role[] = [
  'staff',
  'lecturer',
  'finance_staff',
  'admin',
  'super_admin',
] as const

/** Teaching: grading, attendance, the course catalogue and exam timetable. */
export const TEACHING_ROLES: readonly Role[] = ['staff', 'lecturer', 'admin', 'super_admin'] as const

/** Money: expenses, ledger, campaigns, fee schedules. */
export const FINANCE_ROLES: readonly Role[] = [
  'staff',
  'finance_staff',
  'admin',
  'super_admin',
] as const

/** Who may open /academic at all - students get their own view there. */
export const ACADEMIC_PAGE_ROLES: readonly Role[] = ['student', ...TEACHING_ROLES] as const

/** Who may open /finance at all - students see their own fees there. */
export const FINANCE_PAGE_ROLES: readonly Role[] = ['student', ...FINANCE_ROLES] as const

/** Roles an applicant may ask for at sign-up. Super Admin is absent on
 * purpose: it is platform-wide, so it stays grantable only by an existing
 * super admin (the API rejects it here too). */
export const REQUESTABLE_ROLES: readonly Role[] = [
  'student',
  'lecturer',
  'finance_staff',
  'admin',
] as const

export function hasRole(role: Role | undefined | null, allowed: readonly Role[]): boolean {
  return role != null && allowed.includes(role)
}
