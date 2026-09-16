import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { useEmployeeNames, useEmployees } from '@/features/hr/admin/useEmployeeNames'
import { createShift, fetchShifts, issueShiftQrToken } from '@/services/hrService'
import type { ShiftQrToken } from '@/types/hr'

export function ShiftsPanel() {
  const queryClient = useQueryClient()
  const employeesQuery = useEmployees()
  const employeeName = useEmployeeNames()
  const [employeeId, setEmployeeId] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [tokens, setTokens] = useState<Record<string, ShiftQrToken>>({})
  const [tokenError, setTokenError] = useState<string | null>(null)

  const shiftsQuery = useQuery({ queryKey: ['hr', 'shifts'], queryFn: fetchShifts })

  const createMutation = useMutation({
    mutationFn: () =>
      createShift({
        employeeId,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
      }),
    onSuccess: async () => {
      setStartsAt('')
      setEndsAt('')
      setError(null)
      await queryClient.invalidateQueries({ queryKey: ['hr', 'shifts'] })
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not create shift'),
  })

  const tokenMutation = useMutation({
    mutationFn: (shiftId: string) => issueShiftQrToken(shiftId),
    onSuccess: (token, shiftId) => {
      setTokenError(null)
      setTokens((current) => ({ ...current, [shiftId]: token }))
    },
    onError: (err) => setTokenError(err instanceof Error ? err.message : 'Could not issue token'),
  })

  const employees = employeesQuery.data ?? []

  return (
    <div>
      <section>
        <h2 className="text-sm font-medium text-text">Schedule a shift</h2>
        {employees.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No employees yet"
              message="Hire a candidate under Recruitment before scheduling shifts."
            />
          </div>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              createMutation.mutate()
            }}
            className="mt-4 grid gap-3 sm:grid-cols-4 sm:items-end"
          >
            <FormField label="Employee" htmlFor="shift-employee">
              <select
                id="shift-employee"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                required
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
              >
                <option value="">Select…</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.fullName}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Starts" htmlFor="shift-starts">
              <Input
                id="shift-starts"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Ends" htmlFor="shift-ends">
              <Input
                id="shift-ends"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                required
              />
            </FormField>
            <Button type="submit" size="sm" isLoading={createMutation.isPending}>
              Create shift
            </Button>
            {error ? (
              <p role="alert" className="text-xs text-error sm:col-span-4">
                {error}
              </p>
            ) : null}
          </form>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-text">Scheduled shifts</h2>
        <p className="mt-1 text-sm text-muted">
          Issue a check-in token at the start of a shift. Tokens are short-lived, so generate one when
          the employee is ready to scan.
        </p>
        {tokenError ? (
          <p role="alert" className="mt-2 text-xs text-error">
            {tokenError}
          </p>
        ) : null}

        {shiftsQuery.isPending ? (
          <div className="mt-4">
            <Skeleton className="h-24 w-full" />
          </div>
        ) : shiftsQuery.isError ? (
          <div className="mt-4">
            <ErrorState message="Could not load shifts." />
          </div>
        ) : shiftsQuery.data.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No shifts scheduled" message="Create the first one above." />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {shiftsQuery.data.map((shift) => {
              const token = tokens[shift.id]
              return (
                <li key={shift.id} className="rounded-lg border border-border bg-surface-elevated p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text">{employeeName(shift.employeeId)}</p>
                      <p className="mt-0.5 text-sm text-muted">
                        {new Date(shift.startsAt).toLocaleString()} →{' '}
                        {new Date(shift.endsAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => tokenMutation.mutate(shift.id)}
                      isLoading={tokenMutation.isPending && tokenMutation.variables === shift.id}
                    >
                      Issue check-in token
                    </Button>
                  </div>
                  {token ? (
                    <div className="mt-3 rounded-md border border-border bg-surface p-3">
                      <p className="text-xs uppercase tracking-wide text-muted">Check-in token</p>
                      <p className="mt-1 break-all font-mono text-sm text-text">{token.token}</p>
                      <p className="mt-1 text-xs text-muted">
                        Expires {new Date(token.expiresAt).toLocaleTimeString()}
                      </p>
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
