import { useState } from 'react'

import { AssetsPanel } from '@/features/hr/admin/AssetsPanel'
import { LeaveApprovalsPanel } from '@/features/hr/admin/LeaveApprovalsPanel'
import { PayrollPanel } from '@/features/hr/admin/PayrollPanel'
import { PerformancePanel } from '@/features/hr/admin/PerformancePanel'
import { RecruitmentPanel } from '@/features/hr/admin/RecruitmentPanel'
import { ShiftsPanel } from '@/features/hr/admin/ShiftsPanel'

const TABS = [
  { id: 'leave', label: 'Leave approvals' },
  { id: 'recruitment', label: 'Recruitment' },
  { id: 'shifts', label: 'Shifts' },
  { id: 'performance', label: 'Performance' },
  { id: 'assets', label: 'Assets' },
  { id: 'payroll', label: 'Payroll' },
] as const

type TabId = (typeof TABS)[number]['id']

export function AdminHRPage() {
  const [tab, setTab] = useState<TabId>('leave')

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">People & Operations</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text">People workspace</h1>

      <div role="tablist" aria-label="People sections" className="mt-6 flex flex-wrap gap-2">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            id={`hr-tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`hr-panel-${id}`}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === id
                ? 'bg-surface-elevated text-text'
                : 'text-muted hover:bg-surface-elevated/60 hover:text-text'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`hr-panel-${tab}`} aria-labelledby={`hr-tab-${tab}`} className="mt-6">
        {tab === 'leave' ? <LeaveApprovalsPanel /> : null}
        {tab === 'recruitment' ? <RecruitmentPanel /> : null}
        {tab === 'shifts' ? <ShiftsPanel /> : null}
        {tab === 'performance' ? <PerformancePanel /> : null}
        {tab === 'assets' ? <AssetsPanel /> : null}
        {tab === 'payroll' ? <PayrollPanel /> : null}
      </div>
    </div>
  )
}
