import { useState } from 'react'

import { CampaignsPanel } from '@/features/finance/staff/CampaignsPanel'
import { ExpensesPanel } from '@/features/finance/staff/ExpensesPanel'
import { FinanceSettingsPanel } from '@/features/finance/staff/FinanceSettingsPanel'
import { FinancialOverviewPanel } from '@/features/finance/staff/FinancialOverviewPanel'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'campaigns', label: 'Marketing' },
  { id: 'settings', label: 'Fees & reports' },
] as const

type TabId = (typeof TABS)[number]['id']

export function StaffFinancePage() {
  const [tab, setTab] = useState<TabId>('overview')

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">Finance & Marketing</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text">Finance workspace</h1>

      <div role="tablist" aria-label="Finance sections" className="mt-6 flex flex-wrap gap-2">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            id={`fin-tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`fin-panel-${id}`}
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

      <div
        role="tabpanel"
        id={`fin-panel-${tab}`}
        aria-labelledby={`fin-tab-${tab}`}
        className="mt-6"
      >
        {tab === 'overview' ? <FinancialOverviewPanel /> : null}
        {tab === 'expenses' ? <ExpensesPanel /> : null}
        {tab === 'campaigns' ? <CampaignsPanel /> : null}
        {tab === 'settings' ? <FinanceSettingsPanel /> : null}
      </div>
    </div>
  )
}
