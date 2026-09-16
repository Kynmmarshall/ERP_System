import { useAuth } from '@/features/auth/AuthContext'
import { ADMIN_ROLES, hasRole } from '@/features/auth/roles'
import { AttendanceSection } from '@/features/hr/AttendanceSection'
import { LeaveSection } from '@/features/hr/LeaveSection'
import { NotificationsSection } from '@/features/hr/NotificationsSection'
import { PayslipsSection } from '@/features/hr/PayslipsSection'
import { AdminHRPage } from '@/features/hr/admin/AdminHRPage'

export function HRPage() {
  const { principal } = useAuth()

  // Admins get the management workspace; every other employee role gets
  // their own self-service view.
  if (hasRole(principal?.role, ADMIN_ROLES)) {
    return <AdminHRPage />
  }

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">People & Operations</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text">My workspace</h1>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <LeaveSection />
        <AttendanceSection />
        <PayslipsSection />
        <NotificationsSection />
      </div>
    </div>
  )
}
