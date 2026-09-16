import { BarChart3, GraduationCap, Settings, ShieldCheck, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useAuth } from '@/features/auth/AuthContext'
import { ROLE_LABELS } from '@/features/auth/roles'
import type { Role } from '@/types/auth'

type QuickLink = { to: string; label: string; description: string; icon: typeof Users }

/** Each role only ever sees links to areas its own role can actually open -
 * the same bands the router and the API enforce. Deliberately no headline
 * metrics here: this links to real screens rather than inventing numbers no
 * endpoint returns yet. */
const LINKS_BY_ROLE: Record<Role, QuickLink[]> = {
  student: [
    {
      to: '/academic',
      label: 'My studies',
      description: 'Enrol in a programme, register courses and track your at-risk status.',
      icon: GraduationCap,
    },
    {
      to: '/finance',
      label: 'My fees',
      description: 'View tuition invoices, pay by mobile money and download receipts.',
      icon: BarChart3,
    },
  ],
  staff: [
    {
      to: '/academic',
      label: 'My teaching',
      description: 'Grade assessments, take attendance and review at-risk students on your offerings.',
      icon: GraduationCap,
    },
    {
      to: '/finance',
      label: 'Finance & marketing',
      description: 'Record expenses, track the ledger and run admissions campaigns.',
      icon: BarChart3,
    },
    {
      to: '/people',
      label: 'My workplace',
      description: 'Leave requests, shift attendance, payslips and notifications.',
      icon: Users,
    },
  ],
  admin: [
    {
      to: '/settings',
      label: 'User access',
      description: 'Grant or revoke Staff and Admin access for your institution.',
      icon: Settings,
    },
    {
      to: '/academic',
      label: 'Academic operations',
      description: 'Course catalogue, offerings, exam timetable, grading and appeals.',
      icon: GraduationCap,
    },
    {
      to: '/finance',
      label: 'Finance & marketing',
      description: 'Ledger, expenses, monthly summaries, fee schedules and campaign ROI.',
      icon: BarChart3,
    },
    {
      to: '/people',
      label: 'People & operations',
      description: 'Leave approvals, recruitment, assets and payroll runs.',
      icon: Users,
    },
    {
      to: '/status',
      label: 'System status',
      description: 'Live health of the gateway and every service.',
      icon: ShieldCheck,
    },
  ],
  super_admin: [
    {
      to: '/settings',
      label: 'User access',
      description: 'Grant or revoke any role, including Super Admin.',
      icon: Settings,
    },
    {
      to: '/people',
      label: 'People & operations',
      description: 'Verify payroll rate schedules and release payroll runs.',
      icon: Users,
    },
    {
      to: '/academic',
      label: 'Academic operations',
      description: 'Course catalogue, offerings, exam timetable, grading and appeals.',
      icon: GraduationCap,
    },
    {
      to: '/finance',
      label: 'Finance & marketing',
      description: 'Ledger, expenses, monthly summaries, fee schedules and campaign ROI.',
      icon: BarChart3,
    },
    {
      to: '/status',
      label: 'System status',
      description: 'Live health of the gateway and every service.',
      icon: ShieldCheck,
    },
  ],
}

export function OverviewPage() {
  const { principal } = useAuth()
  const role = principal?.role
  const links = role ? LINKS_BY_ROLE[role] : []

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">Overview</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-text">
        Welcome, {principal?.fullName ?? 'there'}
      </h1>
      <p className="mt-2 text-sm text-muted">
        Signed in as <span className="text-text">{role ? ROLE_LABELS[role] : 'unknown role'}</span>
        {principal?.institutionId ? ' at ICT University' : ' (platform administrator)'}.
      </p>

      {links.length > 0 ? (
        <section aria-labelledby="quick-links-heading" className="mt-8">
          <h2 id="quick-links-heading" className="text-sm font-medium text-text">
            Where to go next
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {links.map(({ to, label, description, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-primary/50 hover:bg-surface-elevated"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-text">
                  <Icon className="size-4 text-primary" aria-hidden="true" />
                  {label}
                </span>
                <span className="text-sm text-muted">{description}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
