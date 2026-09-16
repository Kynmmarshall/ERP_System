import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useEmployeeNames } from '@/features/hr/admin/useEmployeeNames'
import { decideLeaveRequest, fetchLeaveRequests } from '@/services/hrService'
import type { LeaveStatus } from '@/types/hr'

const STATUS_STYLES: Record<LeaveStatus, string> = {
  pending: 'bg-warning/10 text-warning',
  approved: 'bg-success/10 text-success',
  rejected: 'bg-error/10 text-error',
}

export function LeaveApprovalsPanel() {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const employeeName = useEmployeeNames()

  const requestsQuery = useQuery({ queryKey: ['hr', 'leave-requests'], queryFn: fetchLeaveRequests })

  const mutation = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) => decideLeaveRequest(id, approve),
    onSuccess: async () => {
      setError(null)
      await queryClient.invalidateQueries({ queryKey: ['hr', 'leave-requests'] })
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not record the decision'),
  })

  const requests = requestsQuery.data ?? []
  const pending = requests.filter((request) => request.status === 'pending')
  const decided = requests.filter((request) => request.status !== 'pending')

  return (
    <div>
      <h2 className="text-sm font-medium text-text">Awaiting your decision</h2>
      <p className="mt-1 text-sm text-muted">
        Approving or rejecting a request notifies the employee. A decision is final - there is no undo.
      </p>

      {error ? (
        <p role="alert" className="mt-3 text-xs text-error">
          {error}
        </p>
      ) : null}

      {requestsQuery.isPending ? (
        <div className="mt-4">
          <Skeleton className="h-24 w-full" />
        </div>
      ) : requestsQuery.isError ? (
        <div className="mt-4">
          <ErrorState message="Could not load leave requests." />
        </div>
      ) : pending.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="Nothing pending" message="Every leave request has been decided." />
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {pending.map((request) => (
            <li
              key={request.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-elevated p-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-text">{employeeName(request.employeeId)}</p>
                <p className="mt-0.5 text-sm text-muted">
                  {request.startsOn} → {request.endsOn}
                </p>
                <p className="mt-1 text-sm text-muted">{request.reason}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => mutation.mutate({ id: request.id, approve: true })}
                  isLoading={mutation.isPending && mutation.variables?.id === request.id}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => mutation.mutate({ id: request.id, approve: false })}
                >
                  Reject
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {decided.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-sm font-medium text-text">Decision history</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <caption className="sr-only">Decided leave requests</caption>
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                  <th scope="col" className="py-2 pr-4 font-medium">Employee</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Dates</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Status</th>
                  <th scope="col" className="py-2 font-medium">Decided</th>
                </tr>
              </thead>
              <tbody>
                {decided.map((request) => (
                  <tr key={request.id} className="border-b border-border/60">
                    <td className="py-2 pr-4 text-text">{employeeName(request.employeeId)}</td>
                    <td className="py-2 pr-4 text-muted">
                      {request.startsOn} → {request.endsOn}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[request.status]}`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="py-2 text-muted">
                      {request.decidedAt ? new Date(request.decidedAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  )
}
