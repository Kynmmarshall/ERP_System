import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/ErrorState'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/features/auth/AuthContext'
import { ADMIN_ROLES, hasRole } from '@/features/auth/roles'
import { fetchPrograms, fetchTerms } from '@/services/academicService'
import { createFeeSchedule, regenerateSummary } from '@/services/financeService'

const selectClass = 'mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text'

function FeeScheduleForm() {
  const programsQuery = useQuery({ queryKey: ['programs'], queryFn: fetchPrograms })
  const termsQuery = useQuery({ queryKey: ['terms'], queryFn: fetchTerms })
  const [programId, setProgramId] = useState('')
  const [termId, setTermId] = useState('')
  const [amountXaf, setAmountXaf] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => createFeeSchedule({ programId, termId, amountXaf: Number(amountXaf) }),
    onSuccess: () => {
      setError(null)
      setStatus('Fee schedule saved. New enrollments for this programme and term will be invoiced at this amount.')
    },
    onError: (err) => {
      setStatus(null)
      setError(err instanceof Error ? err.message : 'Could not save fee schedule')
    },
  })

  if (programsQuery.isPending || termsQuery.isPending) return <Skeleton className="h-24 w-full" />
  if (programsQuery.isError || termsQuery.isError) {
    return <ErrorState message="Could not load programmes or terms." />
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        mutation.mutate()
      }}
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
    >
      <div>
        <label htmlFor="fee-program" className="block text-sm font-medium text-text">
          Programme
        </label>
        <select
          id="fee-program"
          value={programId}
          onChange={(e) => setProgramId(e.target.value)}
          className={selectClass}
          required
        >
          <option value="">Select…</option>
          {programsQuery.data.map((program) => (
            <option key={program.id} value={program.id}>
              {program.code} — {program.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="fee-term" className="block text-sm font-medium text-text">
          Term
        </label>
        <select
          id="fee-term"
          value={termId}
          onChange={(e) => setTermId(e.target.value)}
          className={selectClass}
          required
        >
          <option value="">Select…</option>
          {termsQuery.data.map((term) => (
            <option key={term.id} value={term.id}>
              {term.name}
            </option>
          ))}
        </select>
      </div>
      <FormField label="Tuition (XAF)" htmlFor="fee-amount">
        <Input
          id="fee-amount"
          type="number"
          min={0}
          value={amountXaf}
          onChange={(e) => setAmountXaf(e.target.value)}
          required
        />
      </FormField>
      <Button type="submit" size="sm" isLoading={mutation.isPending}>
        Save fee schedule
      </Button>
      {status ? (
        <p className="text-xs text-success sm:col-span-2 lg:col-span-4">{status}</p>
      ) : null}
      {error ? (
        <p role="alert" className="text-xs text-error sm:col-span-2 lg:col-span-4">
          {error}
        </p>
      ) : null}
    </form>
  )
}

function RegenerateSummaryForm() {
  const queryClient = useQueryClient()
  const [period, setPeriod] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    // The API takes a date; a month input gives YYYY-MM, and summaries are
    // keyed to the first of the month.
    mutationFn: () => regenerateSummary(`${period}-01`),
    onSuccess: async (summary) => {
      setError(null)
      setStatus(`Regenerated ${summary.period} as version ${summary.version}.`)
      await queryClient.invalidateQueries({ queryKey: ['summaries'] })
    },
    onError: (err) => {
      setStatus(null)
      setError(err instanceof Error ? err.message : 'Could not regenerate the summary')
    },
  })

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        mutation.mutate()
      }}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <FormField label="Period" htmlFor="summary-period">
        <Input
          id="summary-period"
          type="month"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          required
        />
      </FormField>
      <Button type="submit" size="sm" isLoading={mutation.isPending}>
        Regenerate summary
      </Button>
      {status ? <p className="text-xs text-success">{status}</p> : null}
      {error ? (
        <p role="alert" className="text-xs text-error">
          {error}
        </p>
      ) : null}
    </form>
  )
}

export function FinanceSettingsPanel() {
  const { principal } = useAuth()

  return (
    <div>
      <section>
        <h2 className="text-sm font-medium text-text">Tuition fee schedule</h2>
        <p className="mt-1 text-sm text-muted">
          Sets the amount finance invoices when a student enrols in this programme and term.
        </p>
        <div className="mt-4">
          <FeeScheduleForm />
        </div>
      </section>

      {hasRole(principal?.role, ADMIN_ROLES) ? (
        <section className="mt-10">
          <h2 className="text-sm font-medium text-text">Regenerate a monthly summary</h2>
          <p className="mt-1 text-sm text-muted">
            Creates a new version rather than overwriting - earlier versions stay auditable.
          </p>
          <div className="mt-4">
            <RegenerateSummaryForm />
          </div>
        </section>
      ) : null}
    </div>
  )
}
