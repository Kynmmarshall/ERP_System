import { useQuery } from '@tanstack/react-query'

import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { fetchOfferingAtRisk } from '@/services/academicService'

function formatRate(value: number | null): string {
  return value === null ? 'No data' : `${Math.round(value * 100)}%`
}

function formatAverage(value: number | null): string {
  return value === null ? 'No data' : value.toFixed(1)
}

export function AtRiskPanel({ courseOfferingId }: { courseOfferingId: string }) {
  const atRiskQuery = useQuery({
    queryKey: ['offering-at-risk', courseOfferingId],
    queryFn: () => fetchOfferingAtRisk(courseOfferingId),
  })

  return (
    <section className="mt-8">
      <h2 className="text-sm font-medium text-text">At-risk students</h2>
      <p className="mt-1 text-sm text-muted">
        Flagged when attendance is below 75% or the latest two published assessments average below
        50%. Students with no data yet are reported as unknown, never as at risk.
      </p>

      {atRiskQuery.isPending ? (
        <div className="mt-4">
          <Skeleton className="h-20 w-full" />
        </div>
      ) : atRiskQuery.isError ? (
        <div className="mt-4">
          <ErrorState message="Could not load at-risk status." />
        </div>
      ) : atRiskQuery.data.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="Nothing to report" message="No students are registered for this offering yet." />
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <caption className="sr-only">At-risk status per student</caption>
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th scope="col" className="py-2 pr-4 font-medium">Student</th>
                <th scope="col" className="py-2 pr-4 font-medium">Attendance</th>
                <th scope="col" className="py-2 pr-4 font-medium">Assessment average</th>
                <th scope="col" className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {atRiskQuery.data.map((row) => (
                <tr key={row.studentId} className="border-b border-border/60">
                  <td className="py-2 pr-4 text-text">Student {row.studentId.slice(0, 8)}</td>
                  <td className="py-2 pr-4 text-muted">{formatRate(row.attendanceRate)}</td>
                  <td className="py-2 pr-4 text-muted">{formatAverage(row.assessmentAverage)}</td>
                  <td className="py-2">
                    <span
                      className={
                        row.atRisk
                          ? 'rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning'
                          : 'rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success'
                      }
                    >
                      {row.atRisk ? 'At risk' : 'Healthy'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
