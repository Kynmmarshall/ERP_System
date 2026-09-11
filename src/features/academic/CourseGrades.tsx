import { useQueries, useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { fetchAssessments, fetchGrades, submitGradeAppeal } from '@/services/academicService'

function AppealForm({ gradeId, onDone }: { gradeId: string; onDone: () => void }) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await submitGradeAppeal(gradeId, reason)
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit appeal')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-2 flex flex-col gap-2 rounded-md border border-border bg-surface-elevated/40 p-3">
      <textarea
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Explain why you believe this grade is incorrect"
        rows={2}
        className="w-full rounded-md border border-border bg-surface p-2 text-sm text-text placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      />
      {error ? <p className="text-xs text-error">{error}</p> : null}
      <Button size="sm" isLoading={submitting} disabled={!reason.trim()} onClick={submit} className="w-fit">
        Submit appeal
      </Button>
    </div>
  )
}

export function CourseGrades({ courseOfferingId }: { courseOfferingId: string }) {
  const [expanded, setExpanded] = useState(false)
  const [appealingGradeId, setAppealingGradeId] = useState<string | null>(null)
  const [appealedGradeIds, setAppealedGradeIds] = useState<Set<string>>(new Set())

  const assessmentsQuery = useQuery({
    queryKey: ['assessments', courseOfferingId],
    queryFn: () => fetchAssessments(courseOfferingId),
    enabled: expanded,
  })

  const gradeQueries = useQueries({
    queries: (assessmentsQuery.data ?? []).map((assessment) => ({
      queryKey: ['grades', assessment.id],
      queryFn: () => fetchGrades(assessment.id),
      enabled: expanded,
    })),
  })

  if (!expanded) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setExpanded(true)}>
        View grades
      </Button>
    )
  }

  if (assessmentsQuery.isPending) {
    return <Skeleton className="h-6 w-40" />
  }

  if (assessmentsQuery.isError) {
    return <p className="text-xs text-error">Could not load grades</p>
  }

  if (assessmentsQuery.data.length === 0) {
    return <p className="text-xs text-muted">No assessments yet</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {assessmentsQuery.data.map((assessment, index) => {
        const gradeQuery = gradeQueries[index]
        const grade = gradeQuery?.data?.[0]
        return (
          <div key={assessment.id} className="flex flex-col gap-1 border-b border-border/60 pb-2 last:border-0">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text">{assessment.name}</span>
              {gradeQuery?.isPending ? (
                <Skeleton className="h-4 w-16" />
              ) : grade ? (
                <span className="text-muted">
                  {grade.score}/{assessment.maxScore}
                </span>
              ) : (
                <span className="text-muted">Not graded</span>
              )}
            </div>
            {grade && grade.published ? (
              appealedGradeIds.has(grade.id) ? (
                <p className="text-xs text-success">Appeal submitted</p>
              ) : appealingGradeId === grade.id ? (
                <AppealForm
                  gradeId={grade.id}
                  onDone={() => {
                    setAppealedGradeIds((prev) => new Set(prev).add(grade.id))
                    setAppealingGradeId(null)
                  }}
                />
              ) : (
                <Button variant="ghost" size="sm" className="w-fit" onClick={() => setAppealingGradeId(grade.id)}>
                  Appeal this grade
                </Button>
              )
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
