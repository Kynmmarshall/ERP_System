import { useState } from 'react'

import { EmptyState } from '@/components/ui/EmptyState'
import { AppealsPanel } from '@/features/academic/staff/AppealsPanel'
import { AtRiskPanel } from '@/features/academic/staff/AtRiskPanel'
import { AttendancePanel } from '@/features/academic/staff/AttendancePanel'
import { CourseCatalogPanel } from '@/features/academic/staff/CourseCatalogPanel'
import { ExamSchedulePanel } from '@/features/academic/staff/ExamSchedulePanel'
import { GradingPanel } from '@/features/academic/staff/GradingPanel'
import { OfferingPicker } from '@/features/academic/staff/OfferingPicker'

const TABS = [
  { id: 'teaching', label: 'Teaching' },
  { id: 'catalogue', label: 'Courses' },
  { id: 'exams', label: 'Exams' },
] as const

type TabId = (typeof TABS)[number]['id']

export function StaffAcademicPage() {
  const [tab, setTab] = useState<TabId>('teaching')
  const [offeringId, setOfferingId] = useState<string | null>(null)

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">Academic</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text">Teaching workspace</h1>

      <div role="tablist" aria-label="Academic sections" className="mt-6 flex flex-wrap gap-2">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
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

      {tab === 'teaching' ? (
        <div role="tabpanel" id="panel-teaching" aria-labelledby="tab-teaching" className="mt-6">
          <OfferingPicker value={offeringId} onChange={setOfferingId} />
          {offeringId === null ? (
            <div className="mt-6">
              <EmptyState
                title="Select a course offering"
                message="Pick an offering above to record grades, take attendance and review appeals."
              />
            </div>
          ) : (
            <>
              <GradingPanel courseOfferingId={offeringId} />
              <AttendancePanel courseOfferingId={offeringId} />
              <AtRiskPanel courseOfferingId={offeringId} />
              <AppealsPanel courseOfferingId={offeringId} />
            </>
          )}
        </div>
      ) : null}

      {tab === 'catalogue' ? (
        <div role="tabpanel" id="panel-catalogue" aria-labelledby="tab-catalogue" className="mt-6">
          <CourseCatalogPanel />
        </div>
      ) : null}

      {tab === 'exams' ? (
        <div role="tabpanel" id="panel-exams" aria-labelledby="tab-exams" className="mt-6">
          <ExamSchedulePanel />
        </div>
      ) : null}
    </div>
  )
}
