import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  decideAppeal,
  fetchAppealsForGrade,
  fetchAssessments,
  fetchGrades,
} from '@/services/academicService'
import type { GradeAppeal } from '@/types/academic'

/** The API exposes appeals per grade only (no global queue endpoint), so the
 * queue is assembled client-side from this offering's assessments. */
function useOfferingAppeals(courseOfferingId: string) {
  const assessmentsQuery = useQuery({
    queryKey: ['assessments', courseOfferingId],
    queryFn: () => fetchAssessments(courseOfferingId),
  })

  const gradesQueries = useQuery({
    queryKey: ['offering-appeals', courseOfferingId, assessmentsQuery.data?.map((a) => a.id)],
    enabled: Boolean(assessmentsQuery.data),
    queryFn: async () => {
      const assessments = assessmentsQuery.data ?? []
      const rows: { appeal: GradeAppeal; assessmentName: string; score: number }[] = []
      for (const assessment of assessments) {
        const grades = await fetchGrades(assessment.id)
        for (const grade of grades) {
          const appeals = await fetchAppealsForGrade(grade.id)
          for (const appeal of appeals) {
            rows.push({ appeal, assessmentName: assessment.name, score: grade.score })
          }
        }
      }
      return rows
    },
  })

  return {
    rows: gradesQueries.data ?? [],
    isPending: assessmentsQuery.isPending || gradesQueries.isPending,
    isError: assessmentsQuery.isError || gradesQueries.isError,
  }
}

function DecisionForm({
  appeal,
  currentScore,
  courseOfferingId,
}: {
  appeal: GradeAppeal
  currentScore: number
  courseOfferingId: string
}) {
  const queryClient = useQueryClient()
  const [notes, setNotes] = useState('')
  const [correctedScore, setCorrectedScore] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (status: 'accepted' | 'rejected') =>
      decideAppeal(appeal.id, {
        status,
        reviewerNotes: notes || undefined,
        correctedScore:
          status === 'accepted' && correctedScore !== '' ? Number(correctedScore) : undefined,
      }),
    onSuccess: async () => {
      setError(null)
      await queryClient.invalidateQueries({ queryKey: ['offering-appeals', courseOfferingId] })
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not record the decision'),
  })

  return (
    <div className="mt-3 flex flex-col gap-3 border-t border-border/60 pt-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`notes-${appeal.id}`} className="block text-sm font-medium text-text">
            Reviewer notes
          </label>
          <Input
            id={`notes-${appeal.id}`}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Why this decision was reached"
          />
        </div>
        <div>
          <label htmlFor={`score-${appeal.id}`} className="block text-sm font-medium text-text">
            Corrected score (accept only)
          </label>
          <Input
            id={`score-${appeal.id}`}
            type="number"
            min={0}
            value={correctedScore}
            onChange={(event) => setCorrectedScore(event.target.value)}
            placeholder={String(currentScore)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" isLoading={mutation.isPending} onClick={() => mutation.mutate('accepted')}>
          Accept
        </Button>
        <Button
          size="sm"
          variant="secondary"
          isLoading={mutation.isPending}
          onClick={() => mutation.mutate('rejected')}
        >
          Reject
        </Button>
        <span className="text-xs text-muted">
          Accepting with a corrected score amends the grade and writes an audit record.
        </span>
      </div>

      {error ? (
        <p role="alert" className="text-xs text-error">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function AppealsPanel({ courseOfferingId }: { courseOfferingId: string }) {
  const { rows, isPending, isError } = useOfferingAppeals(courseOfferingId)

  return (
    <section className="mt-8">
      <h2 className="text-sm font-medium text-text">Grade appeals</h2>

      {isPending ? (
        <div className="mt-4">
          <Skeleton className="h-20 w-full" />
        </div>
      ) : isError ? (
        <div className="mt-4">
          <ErrorState message="Could not load appeals for this offering." />
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="No appeals" message="No student has appealed a grade in this offering." />
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {rows.map(({ appeal, assessmentName, score }) => {
            const decided = appeal.status === 'accepted' || appeal.status === 'rejected'
            return (
              <li key={appeal.id} className="rounded-lg border border-border bg-surface p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-text">
                      {assessmentName} · Student {appeal.studentId.slice(0, 8)}
                    </p>
                    <p className="mt-1 text-xs text-muted">Current score {score}</p>
                  </div>
                  <span className="text-xs uppercase tracking-wide text-muted">{appeal.status}</span>
                </div>
                <p className="mt-2 text-sm text-muted">{appeal.reason}</p>

                {decided ? (
                  <p className="mt-3 border-t border-border/60 pt-3 text-xs text-muted">
                    Decided{appeal.reviewerNotes ? `: ${appeal.reviewerNotes}` : '.'}
                  </p>
                ) : (
                  <DecisionForm
                    appeal={appeal}
                    currentScore={score}
                    courseOfferingId={courseOfferingId}
                  />
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
