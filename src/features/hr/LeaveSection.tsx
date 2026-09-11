import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { fetchMyLeaveRequests, submitLeaveRequest } from '@/services/hrService'
import type { LeaveStatus } from '@/types/hr'

const STATUS_CLASSES: Record<LeaveStatus, string> = {
  pending: 'text-warning',
  approved: 'text-success',
  rejected: 'text-error',
}

function LeaveRequestForm({ onSubmitted }: { onSubmitted: () => void }) {
  const [startsOn, setStartsOn] = useState('')
  const [endsOn, setEndsOn] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => submitLeaveRequest({ startsOn, endsOn, reason }),
    onSuccess: () => {
      setStartsOn('')
      setEndsOn('')
      setReason('')
      onSubmitted()
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not submit leave request'),
  })

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        setError(null)
        mutation.mutate()
      }}
      className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap"
    >
      <FormField label="Starts on" htmlFor="leave-starts-on">
        <Input
          id="leave-starts-on"
          type="date"
          value={startsOn}
          onChange={(event) => setStartsOn(event.target.value)}
          required
        />
      </FormField>
      <FormField label="Ends on" htmlFor="leave-ends-on">
        <Input
          id="leave-ends-on"
          type="date"
          value={endsOn}
          onChange={(event) => setEndsOn(event.target.value)}
          required
        />
      </FormField>
      <FormField label="Reason" htmlFor="leave-reason">
        <Input
          id="leave-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Reason for leave"
          required
        />
      </FormField>
      <Button type="submit" size="sm" isLoading={mutation.isPending}>
        Request leave
      </Button>
      {error ? (
        <p role="alert" className="text-xs text-error">
          {error}
        </p>
      ) : null}
    </form>
  )
}

export function LeaveSection() {
  const queryClient = useQueryClient()
  const leaveQuery = useQuery({ queryKey: ['my-leave-requests'], queryFn: fetchMyLeaveRequests })

  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight text-text">Leave</h2>
      <div className="mt-3">
        <LeaveRequestForm
          onSubmitted={() => queryClient.invalidateQueries({ queryKey: ['my-leave-requests'] })}
        />
      </div>

      <div className="mt-4">
        {leaveQuery.isError ? (
          <ErrorState message="Could not load your leave requests." />
        ) : leaveQuery.isPending ? (
          <Skeleton className="h-16 w-full" />
        ) : leaveQuery.data.length === 0 ? (
          <EmptyState title="No leave requests yet" message="Requests you submit appear here." />
        ) : (
          <div className="flex flex-col gap-2">
            {leaveQuery.data.map((request) => (
              <div key={request.id} className="rounded-lg border border-border bg-surface p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text">
                    {request.startsOn} → {request.endsOn}
                  </p>
                  <span className={`text-xs uppercase tracking-wide ${STATUS_CLASSES[request.status]}`}>
                    {request.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">{request.reason}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
