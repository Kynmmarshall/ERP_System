import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { ROLE_LABELS } from '@/features/auth/roles'
import {
  decideRoleRequest,
  fetchRoleRequests,
  fetchUsers,
  type RoleRequestStatus,
} from '@/services/usersService'

const STATUS_STYLES: Record<RoleRequestStatus, string> = {
  pending: 'bg-warning/10 text-warning',
  approved: 'bg-success/10 text-success',
  rejected: 'bg-error/10 text-error',
}

export function RoleRequestsPanel() {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const requestsQuery = useQuery({ queryKey: ['role-requests'], queryFn: fetchRoleRequests })
  const usersQuery = useQuery({ queryKey: ['users'], queryFn: fetchUsers })

  const mutation = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) => decideRoleRequest(id, approve),
    onSuccess: async () => {
      setError(null)
      // Approval changes the user's role, so the table above is stale too.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['role-requests'] }),
        queryClient.invalidateQueries({ queryKey: ['users'] }),
      ])
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not record the decision'),
  })

  const applicants = new Map((usersQuery.data ?? []).map((user) => [user.id, user]))
  const requests = requestsQuery.data ?? []
  const pending = requests.filter((request) => request.status === 'pending')
  const decided = requests.filter((request) => request.status !== 'pending')

  return (
    <section aria-labelledby="access-requests-heading" className="mt-12">
      <h2 id="access-requests-heading" className="text-lg font-semibold tracking-tight text-text">
        Access requests
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        People who picked a Staff or Admin dashboard at sign-up. They are using a Student account
        until you approve; approving is what actually changes their role.
      </p>

      {error ? (
        <div className="mt-4">
          <ErrorState message={error} />
        </div>
      ) : null}

      {requestsQuery.isPending ? (
        <div className="mt-4">
          <Skeleton className="h-20 w-full" />
        </div>
      ) : requestsQuery.isError ? (
        <div className="mt-4">
          <ErrorState message="Could not load access requests." />
        </div>
      ) : pending.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="No pending requests" message="Nobody is waiting on a decision." />
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {pending.map((request) => {
            const applicant = applicants.get(request.userId)
            return (
              <li
                key={request.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-elevated p-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text">
                    {applicant?.fullName ?? 'Unknown applicant'}{' '}
                    <span className="text-muted">wants {ROLE_LABELS[request.requestedRole]}</span>
                  </p>
                  {applicant ? <p className="mt-0.5 text-sm text-muted">{applicant.email}</p> : null}
                  {request.justification ? (
                    <p className="mt-1 text-sm text-muted">“{request.justification}”</p>
                  ) : null}
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
            )
          })}
        </ul>
      )}

      {decided.length > 0 ? (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <caption className="sr-only">Decided access requests</caption>
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th scope="col" className="py-2 pr-4 font-medium">Applicant</th>
                <th scope="col" className="py-2 pr-4 font-medium">Requested</th>
                <th scope="col" className="py-2 pr-4 font-medium">Outcome</th>
                <th scope="col" className="py-2 font-medium">Decided</th>
              </tr>
            </thead>
            <tbody>
              {decided.map((request) => (
                <tr key={request.id} className="border-b border-border/60">
                  <td className="py-2 pr-4 text-text">
                    {applicants.get(request.userId)?.fullName ?? 'Unknown applicant'}
                  </td>
                  <td className="py-2 pr-4 text-muted">{ROLE_LABELS[request.requestedRole]}</td>
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
      ) : null}
    </section>
  )
}
