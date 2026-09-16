import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  closePosition,
  createCandidate,
  createPosition,
  fetchCandidates,
  fetchPositions,
  hireCandidate,
  updateCandidateStage,
} from '@/services/hrService'
import type { Candidate, CandidateStage } from '@/types/hr'

const STAGES: CandidateStage[] = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected']

function NewPositionForm() {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [department, setDepartment] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => createPosition({ title, department }),
    onSuccess: async () => {
      setTitle('')
      setDepartment('')
      setError(null)
      await queryClient.invalidateQueries({ queryKey: ['hr', 'positions'] })
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not create position'),
  })

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        mutation.mutate()
      }}
      className="mt-4 grid gap-3 sm:grid-cols-3 sm:items-end"
    >
      <FormField label="Title" htmlFor="position-title">
        <Input
          id="position-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Lecturer"
          required
        />
      </FormField>
      <FormField label="Department" htmlFor="position-department">
        <Input
          id="position-department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          placeholder="Computer Science"
          required
        />
      </FormField>
      <Button type="submit" size="sm" isLoading={mutation.isPending}>
        Open position
      </Button>
      {error ? (
        <p role="alert" className="text-xs text-error sm:col-span-3">
          {error}
        </p>
      ) : null}
    </form>
  )
}

function HireForm({ candidate, onDone }: { candidate: Candidate; onDone: () => void }) {
  const queryClient = useQueryClient()
  const [department, setDepartment] = useState('')
  const [salary, setSalary] = useState('')
  const [hireDate, setHireDate] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      hireCandidate(candidate.id, {
        department,
        grossMonthlySalaryXaf: Number(salary),
        hireDate,
      }),
    onSuccess: async () => {
      setError(null)
      await queryClient.invalidateQueries({ queryKey: ['hr', 'candidates'] })
      await queryClient.invalidateQueries({ queryKey: ['hr', 'employees'] })
      onDone()
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not hire candidate'),
  })

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        mutation.mutate()
      }}
      className="mt-3 grid gap-3 rounded-lg border border-border bg-surface p-4 sm:grid-cols-4 sm:items-end"
    >
      <p className="text-sm text-muted sm:col-span-4">
        Hiring creates an employee record for {candidate.fullName}. A sign-in account is granted
        separately by an administrator under Settings.
      </p>
      <FormField label="Department" htmlFor={`hire-dept-${candidate.id}`}>
        <Input
          id={`hire-dept-${candidate.id}`}
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          required
        />
      </FormField>
      <FormField label="Gross monthly (XAF)" htmlFor={`hire-salary-${candidate.id}`}>
        <Input
          id={`hire-salary-${candidate.id}`}
          type="number"
          min={0}
          value={salary}
          onChange={(e) => setSalary(e.target.value)}
          required
        />
      </FormField>
      <FormField label="Hire date" htmlFor={`hire-date-${candidate.id}`}>
        <Input
          id={`hire-date-${candidate.id}`}
          type="date"
          value={hireDate}
          onChange={(e) => setHireDate(e.target.value)}
          required
        />
      </FormField>
      <div className="flex gap-2">
        <Button type="submit" size="sm" isLoading={mutation.isPending}>
          Confirm hire
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-xs text-error sm:col-span-4">
          {error}
        </p>
      ) : null}
    </form>
  )
}

function NewCandidateForm({ positions }: { positions: { id: string; title: string }[] }) {
  const queryClient = useQueryClient()
  const [positionId, setPositionId] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => createCandidate({ positionId, fullName, email }),
    onSuccess: async () => {
      setFullName('')
      setEmail('')
      setError(null)
      await queryClient.invalidateQueries({ queryKey: ['hr', 'candidates'] })
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not add candidate'),
  })

  if (positions.length === 0) {
    return (
      <div className="mt-4">
        <EmptyState
          title="No open positions"
          message="Candidates attach to an open position, so open one above first."
        />
      </div>
    )
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        mutation.mutate()
      }}
      className="mt-4 grid gap-3 sm:grid-cols-4 sm:items-end"
    >
      <FormField label="Position" htmlFor="candidate-position">
        <select
          id="candidate-position"
          value={positionId}
          onChange={(e) => setPositionId(e.target.value)}
          required
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
        >
          <option value="">Select…</option>
          {positions.map((position) => (
            <option key={position.id} value={position.id}>
              {position.title}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Full name" htmlFor="candidate-name">
        <Input
          id="candidate-name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </FormField>
      <FormField label="Email" htmlFor="candidate-email">
        <Input
          id="candidate-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </FormField>
      <Button type="submit" size="sm" isLoading={mutation.isPending}>
        Add candidate
      </Button>
      {error ? (
        <p role="alert" className="text-xs text-error sm:col-span-4">
          {error}
        </p>
      ) : null}
    </form>
  )
}

export function RecruitmentPanel() {
  const queryClient = useQueryClient()
  const [hiring, setHiring] = useState<string | null>(null)
  const [stageError, setStageError] = useState<string | null>(null)
  const [closeError, setCloseError] = useState<string | null>(null)

  const positionsQuery = useQuery({ queryKey: ['hr', 'positions'], queryFn: fetchPositions })
  const candidatesQuery = useQuery({ queryKey: ['hr', 'candidates'], queryFn: fetchCandidates })

  const closeMutation = useMutation({
    mutationFn: (positionId: string) => closePosition(positionId),
    onSuccess: async () => {
      setCloseError(null)
      await queryClient.invalidateQueries({ queryKey: ['hr', 'positions'] })
    },
    onError: (err) => setCloseError(err instanceof Error ? err.message : 'Could not close position'),
  })

  const stageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: CandidateStage }) => updateCandidateStage(id, stage),
    onSuccess: async () => {
      setStageError(null)
      await queryClient.invalidateQueries({ queryKey: ['hr', 'candidates'] })
    },
    onError: (err) => setStageError(err instanceof Error ? err.message : 'Could not update stage'),
  })

  const positionTitles = new Map((positionsQuery.data ?? []).map((p) => [p.id, p.title]))

  return (
    <div>
      <section>
        <h2 className="text-sm font-medium text-text">Open a position</h2>
        <NewPositionForm />
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-text">Positions</h2>
        <p className="mt-1 text-sm text-muted">
          Closing a position stops new candidates being added to it. Anyone already in the pipeline
          keeps their stage and can still be hired.
        </p>
        {closeError ? (
          <p role="alert" className="mt-2 text-xs text-error">
            {closeError}
          </p>
        ) : null}
        {positionsQuery.isPending ? (
          <div className="mt-4">
            <Skeleton className="h-16 w-full" />
          </div>
        ) : positionsQuery.isError ? (
          <div className="mt-4">
            <ErrorState message="Could not load positions." />
          </div>
        ) : positionsQuery.data.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No positions open" message="Create the first one above." />
          </div>
        ) : (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {positionsQuery.data.map((position) => (
              <li key={position.id} className="rounded-lg border border-border bg-surface-elevated p-3">
                <p className="text-sm font-medium text-text">{position.title}</p>
                <p className="mt-0.5 text-sm text-muted">
                  {position.department} · {position.status === 'open' ? 'Open' : 'Closed'}
                </p>
                {position.status === 'open' ? (
                  <Button
                    className="mt-2"
                    size="sm"
                    variant="secondary"
                    onClick={() => closeMutation.mutate(position.id)}
                    isLoading={closeMutation.isPending && closeMutation.variables === position.id}
                  >
                    Close position
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-text">Add a candidate</h2>
        <NewCandidateForm
          positions={(positionsQuery.data ?? []).filter((position) => position.status === 'open')}
        />
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-text">Pipeline</h2>
        {stageError ? (
          <p role="alert" className="mt-2 text-xs text-error">
            {stageError}
          </p>
        ) : null}
        {candidatesQuery.isPending ? (
          <div className="mt-4">
            <Skeleton className="h-24 w-full" />
          </div>
        ) : candidatesQuery.isError ? (
          <div className="mt-4">
            <ErrorState message="Could not load candidates." />
          </div>
        ) : candidatesQuery.data.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No candidates yet" message="Add the first applicant above." />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {candidatesQuery.data.map((candidate) => (
              <li key={candidate.id} className="rounded-lg border border-border bg-surface-elevated p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text">{candidate.fullName}</p>
                    <p className="mt-0.5 text-sm text-muted">
                      {candidate.email} · {positionTitles.get(candidate.positionId) ?? 'Unknown position'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="sr-only" htmlFor={`stage-${candidate.id}`}>
                      Stage for {candidate.fullName}
                    </label>
                    <select
                      id={`stage-${candidate.id}`}
                      value={candidate.stage}
                      disabled={candidate.stage === 'hired'}
                      onChange={(e) =>
                        stageMutation.mutate({ id: candidate.id, stage: e.target.value as CandidateStage })
                      }
                      className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-text disabled:opacity-60"
                    >
                      {STAGES.map((stage) => (
                        <option key={stage} value={stage}>
                          {stage}
                        </option>
                      ))}
                    </select>
                    {candidate.stage !== 'hired' ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setHiring(hiring === candidate.id ? null : candidate.id)}
                      >
                        {hiring === candidate.id ? 'Close' : 'Hire'}
                      </Button>
                    ) : (
                      <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                        hired
                      </span>
                    )}
                  </div>
                </div>
                {hiring === candidate.id ? (
                  <HireForm candidate={candidate} onDone={() => setHiring(null)} />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
