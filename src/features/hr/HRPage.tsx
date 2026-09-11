import { EmptyState } from '@/components/ui/EmptyState'
import { useAuth } from '@/features/auth/AuthContext'
import { AttendanceSection } from '@/features/hr/AttendanceSection'
import { LeaveSection } from '@/features/hr/LeaveSection'
import { NotificationsSection } from '@/features/hr/NotificationsSection'
import { PayslipsSection } from '@/features/hr/PayslipsSection'

export function HRPage() {
  const { principal } = useAuth()

  if (principal?.role !== 'staff') {
    return (
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">People & Operations</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text">People & Operations</h1>
        <div className="mt-8">
          <EmptyState
            title="Not built yet"
            message="Recruitment, employee records, performance, asset and payroll-approval screens land in a later development phase of this project."
          />
        </div>
      </div>
    )
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
