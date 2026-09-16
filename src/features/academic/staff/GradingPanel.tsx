import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  createAssessment,
  enterGrades,
  fetchAssessments,
  fetchCourseRoster,
  fetchGrades,
  publishGrades,
} from '@/services/academicService'

function shortId(id: string): string {
  return id.slice(0, 8)
}

function NewAssessmentForm({ courseOfferingId }: { courseOfferingId: string }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [maxScore, setMaxScore] = useState('100')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      createAssessment({ courseOfferingId, name, maxScore: Number(maxScore) }),
    onSuccess: async () => {
      setName('')
      setMaxScore('100')
      setError(null)
      await queryClient.invalidateQueries({ queryKey: ['assessments', courseOfferingId] })
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not create assessment'),
  })

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        mutation.mutate()
      }}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <FormField label="Assessment name" htmlFor="assessment-name">
        <Input
          id="assessment-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Midterm"
          required
        />
      </FormField>
      <FormField label="Max score" htmlFor="assessment-max">
        <Input
          id="assessment-max"
          type="number"
          min={1}
          value={maxScore}
          onChange={(event) => setMaxScore(event.target.value)}
          required
        />
      </FormField>
      <Button type="submit" size="sm" isLoading={mutation.isPending}>
        Add assessment
      </Button>
      {error ? (
        <p role="alert" className="text-xs text-error">
          {error}
        </p>
      ) : null}
    </form>
  )
}

function GradeEntry({
  assessmentId,
  maxScore,
  courseOfferingId,
}: {
  assessmentId: string
  maxScore: number
  courseOfferingId: string
}) {
  const queryClient = useQueryClient()
  const [scores, setScores] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  const rosterQuery = useQuery({
    queryKey: ['roster', courseOfferingId],
    queryFn: () => fetchCourseRoster(courseOfferingId),
  })
  const gradesQuery = useQuery({
    queryKey: ['grades', assessmentId],
    queryFn: () => fetchGrades(assessmentId),
  })

  // Seed the inputs from grades already saved so an instructor edits real
  // values rather than silently overwriting them with blanks.
  useEffect(() => {
    if (!gradesQuery.data) return
    setScores((current) => {
      const seeded = { ...current }
      for (const grade of gradesQuery.data) {
        if (seeded[grade.studentId] === undefined) seeded[grade.studentId] = String(grade.score)
      }
      return seeded
    })
  }, [gradesQuery.data])

  const saveMutation = useMutation({
    mutationFn: () => {
      const entries = Object.entries(scores)
        .filter(([, value]) => value !== '')
        .map(([studentId, value]) => ({ studentId, score: Number(value) }))
      return enterGrades(assessmentId, entries)
    },
    onSuccess: async () => {
      setError(null)
      await queryClient.invalidateQueries({ queryKey: ['grades', assessmentId] })
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not save grades'),
  })

  const publishMutation = useMutation({
    mutationFn: () => publishGrades(assessmentId),
    onSuccess: async () => {
      setError(null)
      await queryClient.invalidateQueries({ queryKey: ['grades', assessmentId] })
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not publish grades'),
  })

  if (rosterQuery.isPending || gradesQuery.isPending) return <Skeleton className="h-24 w-full" />
  if (rosterQuery.isError || gradesQuery.isError) {
    return <ErrorState message="Could not load the roster or existing grades." />
  }
  if (rosterQuery.data.length === 0) {
    return <EmptyState title="No students registered" message="Nobody has registered for this offering yet." />
  }

  const anyPublished = gradesQuery.data.some((grade) => grade.published)

  return (
    <div className="mt-3">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">Grade entry for this assessment</caption>
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
            <th scope="col" className="py-2 pr-4 font-medium">Student</th>
            <th scope="col" className="py-2 pr-4 font-medium">Score (max {maxScore})</th>
            <th scope="col" className="py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rosterQuery.data.map((registration) => {
            const grade = gradesQuery.data.find((g) => g.studentId === registration.studentId)
            const inputId = `score-${assessmentId}-${registration.studentId}`
            return (
              <tr key={registration.id} className="border-b border-border/60">
                <td className="py-2 pr-4 text-text">Student {shortId(registration.studentId)}</td>
                <td className="py-2 pr-4">
                  <label className="sr-only" htmlFor={inputId}>
                    Score for student {shortId(registration.studentId)}
                  </label>
                  <input
                    id={inputId}
                    type="number"
                    min={0}
                    max={maxScore}
                    value={scores[registration.studentId] ?? ''}
                    onChange={(event) =>
                      setScores((current) => ({
                        ...current,
                        [registration.studentId]: event.target.value,
                      }))
                    }
                    className="w-24 rounded-md border border-border bg-surface px-2 py-1 text-sm text-text"
                  />
                </td>
                <td className="py-2 text-xs text-muted">
                  {grade ? (grade.published ? 'Published' : 'Saved, unpublished') : 'Not graded'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" isLoading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
          Save grades
        </Button>
        <Button
          size="sm"
          variant="secondary"
          isLoading={publishMutation.isPending}
          onClick={() => publishMutation.mutate()}
        >
          {anyPublished ? 'Publish again' : 'Publish to students'}
        </Button>
        <span className="text-xs text-muted">
          Students cannot see a score until it is published.
        </span>
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-xs text-error">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function GradingPanel({ courseOfferingId }: { courseOfferingId: string }) {
  const [openAssessmentId, setOpenAssessmentId] = useState<string | null>(null)
  const assessmentsQuery = useQuery({
    queryKey: ['assessments', courseOfferingId],
    queryFn: () => fetchAssessments(courseOfferingId),
  })

  return (
    <section className="mt-8">
      <h2 className="text-sm font-medium text-text">Assessments & grades</h2>
      <div className="mt-4">
        <NewAssessmentForm courseOfferingId={courseOfferingId} />
      </div>

      {assessmentsQuery.isPending ? (
        <div className="mt-4">
          <Skeleton className="h-16 w-full" />
        </div>
      ) : assessmentsQuery.isError ? (
        <div className="mt-4">
          <ErrorState message="Could not load assessments." />
        </div>
      ) : assessmentsQuery.data.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="No assessments yet" message="Add one above to start recording grades." />
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {assessmentsQuery.data.map((assessment) => {
            const isOpen = openAssessmentId === assessment.id
            return (
              <li key={assessment.id} className="rounded-lg border border-border bg-surface p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-text">{assessment.name}</p>
                    <p className="text-xs text-muted">Max score {assessment.maxScore}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setOpenAssessmentId(isOpen ? null : assessment.id)}
                  >
                    {isOpen ? 'Close' : 'Enter grades'}
                  </Button>
                </div>
                {isOpen ? (
                  <GradeEntry
                    assessmentId={assessment.id}
                    maxScore={assessment.maxScore}
                    courseOfferingId={courseOfferingId}
                  />
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
