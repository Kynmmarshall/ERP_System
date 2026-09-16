import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  createAttendanceSession,
  fetchAttendanceRecords,
  fetchAttendanceSessions,
  fetchCourseRoster,
  markAttendance,
} from '@/services/academicService'

function shortId(id: string): string {
  return id.slice(0, 8)
}

function MarkRoll({ sessionId, courseOfferingId }: { sessionId: string; courseOfferingId: string }) {
  const queryClient = useQueryClient()
  const [present, setPresent] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)

  const rosterQuery = useQuery({
    queryKey: ['roster', courseOfferingId],
    queryFn: () => fetchCourseRoster(courseOfferingId),
  })
  const recordsQuery = useQuery({
    queryKey: ['attendance-records', sessionId],
    queryFn: () => fetchAttendanceRecords(sessionId),
  })

  // Reflect what was already marked rather than defaulting everyone to absent.
  useEffect(() => {
    if (!recordsQuery.data) return
    setPresent((current) => {
      const seeded = { ...current }
      for (const record of recordsQuery.data) {
        if (seeded[record.studentId] === undefined) seeded[record.studentId] = record.present
      }
      return seeded
    })
  }, [recordsQuery.data])

  const mutation = useMutation({
    mutationFn: () => {
      const records = (rosterQuery.data ?? []).map((registration) => ({
        studentId: registration.studentId,
        present: present[registration.studentId] ?? false,
      }))
      return markAttendance(sessionId, records)
    },
    onSuccess: async () => {
      setError(null)
      await queryClient.invalidateQueries({ queryKey: ['attendance-records', sessionId] })
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not save attendance'),
  })

  if (rosterQuery.isPending || recordsQuery.isPending) return <Skeleton className="h-24 w-full" />
  if (rosterQuery.isError || recordsQuery.isError) {
    return <ErrorState message="Could not load the roster or existing attendance." />
  }
  if (rosterQuery.data.length === 0) {
    return <EmptyState title="No students registered" />
  }

  return (
    <div className="mt-3">
      <ul className="flex flex-col gap-1">
        {rosterQuery.data.map((registration) => {
          const checkboxId = `present-${sessionId}-${registration.studentId}`
          return (
            <li key={registration.id} className="flex items-center gap-3 py-1">
              <input
                id={checkboxId}
                type="checkbox"
                checked={present[registration.studentId] ?? false}
                onChange={(event) =>
                  setPresent((current) => ({
                    ...current,
                    [registration.studentId]: event.target.checked,
                  }))
                }
                className="size-4 rounded border-border"
              />
              <label htmlFor={checkboxId} className="text-sm text-text">
                Student {shortId(registration.studentId)} present
              </label>
            </li>
          )
        })}
      </ul>

      <Button
        size="sm"
        className="mt-3"
        isLoading={mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        Save attendance
      </Button>

      {error ? (
        <p role="alert" className="mt-2 text-xs text-error">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function AttendancePanel({ courseOfferingId }: { courseOfferingId: string }) {
  const queryClient = useQueryClient()
  const [sessionDate, setSessionDate] = useState('')
  const [openSessionId, setOpenSessionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const sessionsQuery = useQuery({
    queryKey: ['attendance-sessions', courseOfferingId],
    queryFn: () => fetchAttendanceSessions(courseOfferingId),
  })

  const createMutation = useMutation({
    mutationFn: () => createAttendanceSession({ courseOfferingId, sessionDate }),
    onSuccess: async () => {
      setSessionDate('')
      setError(null)
      await queryClient.invalidateQueries({ queryKey: ['attendance-sessions', courseOfferingId] })
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not create session'),
  })

  return (
    <section className="mt-8">
      <h2 className="text-sm font-medium text-text">Attendance</h2>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          createMutation.mutate()
        }}
        className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <FormField label="Session date" htmlFor="session-date">
          <Input
            id="session-date"
            type="date"
            value={sessionDate}
            onChange={(event) => setSessionDate(event.target.value)}
            required
          />
        </FormField>
        <Button type="submit" size="sm" isLoading={createMutation.isPending}>
          Add session
        </Button>
        {error ? (
          <p role="alert" className="text-xs text-error">
            {error}
          </p>
        ) : null}
      </form>

      {sessionsQuery.isPending ? (
        <div className="mt-4">
          <Skeleton className="h-16 w-full" />
        </div>
      ) : sessionsQuery.isError ? (
        <div className="mt-4">
          <ErrorState message="Could not load attendance sessions." />
        </div>
      ) : sessionsQuery.data.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="No sessions yet" message="Add a session date above to take the roll." />
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {sessionsQuery.data.map((attendanceSession) => {
            const isOpen = openSessionId === attendanceSession.id
            return (
              <li key={attendanceSession.id} className="rounded-lg border border-border bg-surface p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-text">{attendanceSession.sessionDate}</p>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setOpenSessionId(isOpen ? null : attendanceSession.id)}
                  >
                    {isOpen ? 'Close' : 'Take roll'}
                  </Button>
                </div>
                {isOpen ? (
                  <MarkRoll sessionId={attendanceSession.id} courseOfferingId={courseOfferingId} />
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
