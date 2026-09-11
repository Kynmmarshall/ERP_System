import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { checkIn, fetchMyAttendance } from '@/services/hrService'

/** Accepts the QR code's underlying token as pasted/typed text rather than
 * requiring camera access - a QR scanner can be layered on top of this
 * same check-in call later, but a manual code-entry fallback must always
 * work for accessibility and devices without a camera. */
function CheckInForm({ onCheckedIn }: { onCheckedIn: () => void }) {
  const [token, setToken] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const mutation = useMutation({
    mutationFn: () => checkIn(token),
    onSuccess: () => {
      setToken('')
      setSuccess(true)
      onCheckedIn()
    },
    onError: (err) => {
      setSuccess(false)
      setError(err instanceof Error ? err.message : 'Check-in failed')
    },
  })

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        setError(null)
        mutation.mutate()
      }}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <FormField label="Shift QR code / check-in code" htmlFor="attendance-token">
        <Input
          id="attendance-token"
          value={token}
          onChange={(event) => {
            setToken(event.target.value)
            setSuccess(false)
          }}
          placeholder="Paste or scan the shift code"
          required
        />
      </FormField>
      <Button type="submit" size="sm" isLoading={mutation.isPending}>
        Check in
      </Button>
      {error ? (
        <p role="alert" className="text-xs text-error">
          {error}
        </p>
      ) : null}
      {success ? <p className="text-xs text-success">Checked in.</p> : null}
    </form>
  )
}

export function AttendanceSection() {
  const queryClient = useQueryClient()
  const attendanceQuery = useQuery({ queryKey: ['my-attendance'], queryFn: fetchMyAttendance })

  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight text-text">Attendance</h2>
      <div className="mt-3">
        <CheckInForm onCheckedIn={() => queryClient.invalidateQueries({ queryKey: ['my-attendance'] })} />
      </div>

      <div className="mt-4">
        {attendanceQuery.isError ? (
          <ErrorState message="Could not load your attendance history." />
        ) : attendanceQuery.isPending ? (
          <Skeleton className="h-16 w-full" />
        ) : attendanceQuery.data.length === 0 ? (
          <EmptyState title="No check-ins yet" message="Your shift check-ins appear here." />
        ) : (
          <div className="flex flex-col gap-2">
            {attendanceQuery.data.map((record) => (
              <div key={record.id} className="rounded-lg border border-border bg-surface p-3">
                <p className="text-sm text-text">Checked in at {new Date(record.checkedInAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
