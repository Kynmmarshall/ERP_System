import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { useOfferingOptions } from '@/features/academic/staff/useOfferingOptions'
import { createExamSchedule, fetchExamSchedules } from '@/services/academicService'

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString()
}

export function ExamSchedulePanel() {
  const queryClient = useQueryClient()
  const { options, terms, isPending: optionsPending } = useOfferingOptions()
  const [termId, setTermId] = useState('')
  const [courseOfferingId, setCourseOfferingId] = useState('')
  const [room, setRoom] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [error, setError] = useState<string | null>(null)

  const schedulesQuery = useQuery({
    queryKey: ['exam-schedules', termId],
    queryFn: () => fetchExamSchedules(termId),
    enabled: termId !== '',
  })

  const mutation = useMutation({
    mutationFn: () =>
      createExamSchedule({
        courseOfferingId,
        room,
        // datetime-local has no zone; the API stores UTC, so convert explicitly.
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
      }),
    onSuccess: async () => {
      setError(null)
      setRoom('')
      await queryClient.invalidateQueries({ queryKey: ['exam-schedules', termId] })
    },
    // The API detects room/instructor/student clashes and returns 409 - surface
    // that message verbatim, it is the whole point of the feature.
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not schedule exam'),
  })

  const labelFor = (offeringId: string) =>
    options.find((o) => o.offering.id === offeringId)?.label ?? offeringId.slice(0, 8)

  return (
    <div>
      <section>
        <h2 className="text-sm font-medium text-text">Schedule an exam</h2>
        <p className="mt-1 text-sm text-muted">
          Clashes on room, instructor or a shared student are rejected by the server.
        </p>

        {optionsPending ? (
          <div className="mt-4">
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              mutation.mutate()
            }}
            className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
          >
            <div className="sm:col-span-2">
              <label htmlFor="exam-offering" className="block text-sm font-medium text-text">
                Course offering
              </label>
              <select
                id="exam-offering"
                value={courseOfferingId}
                onChange={(e) => setCourseOfferingId(e.target.value)}
                className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
                required
              >
                <option value="">Select…</option>
                {options.map(({ offering, label }) => (
                  <option key={offering.id} value={offering.id}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <FormField label="Room" htmlFor="exam-room">
              <Input id="exam-room" value={room} onChange={(e) => setRoom(e.target.value)} required />
            </FormField>
            <FormField label="Starts" htmlFor="exam-starts">
              <Input
                id="exam-starts"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Ends" htmlFor="exam-ends">
              <Input
                id="exam-ends"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                required
              />
            </FormField>
            <Button type="submit" size="sm" isLoading={mutation.isPending}>
              Schedule
            </Button>
            {error ? (
              <p role="alert" className="text-xs text-error sm:col-span-2 lg:col-span-5">
                {error}
              </p>
            ) : null}
          </form>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-text">Timetable</h2>
        <div className="mt-4 max-w-md">
          <label htmlFor="timetable-term" className="block text-sm font-medium text-text">
            Term
          </label>
          <select
            id="timetable-term"
            value={termId}
            onChange={(e) => setTermId(e.target.value)}
            className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
          >
            <option value="">Select a term…</option>
            {terms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name}
              </option>
            ))}
          </select>
        </div>

        {termId === '' ? (
          <div className="mt-4">
            <EmptyState title="Pick a term" message="Choose a term to see its exam timetable." />
          </div>
        ) : schedulesQuery.isPending ? (
          <div className="mt-4">
            <Skeleton className="h-20 w-full" />
          </div>
        ) : schedulesQuery.isError ? (
          <div className="mt-4">
            <ErrorState message="Could not load the timetable." />
          </div>
        ) : schedulesQuery.data.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No exams scheduled" message="Nothing is scheduled for this term yet." />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <caption className="sr-only">Exam timetable for the selected term</caption>
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                  <th scope="col" className="py-2 pr-4 font-medium">Course</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Room</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Starts</th>
                  <th scope="col" className="py-2 font-medium">Ends</th>
                </tr>
              </thead>
              <tbody>
                {schedulesQuery.data.map((exam) => (
                  <tr key={exam.id} className="border-b border-border/60">
                    <td className="py-2 pr-4 text-text">{labelFor(exam.courseOfferingId)}</td>
                    <td className="py-2 pr-4 text-muted">{exam.room}</td>
                    <td className="py-2 pr-4 text-muted">{formatWhen(exam.startsAt)}</td>
                    <td className="py-2 text-muted">{formatWhen(exam.endsAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
