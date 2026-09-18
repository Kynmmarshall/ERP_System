import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/features/auth/AuthContext'
import { useEmployeeNames } from '@/features/hr/admin/useEmployeeNames'
import { formatXaf } from '@/lib/currency'
import {
  approvePayrollRun,
  createPayrollRun,
  createPayrollSchedule,
  fetchPayrollRuns,
  fetchPayrollSchedules,
  fetchRunPayslips,
  verifyPayrollSchedule,
} from '@/services/hrService'
import type { PayrollSchedule } from '@/types/hr'

type BracketRow = { upToXaf: string; rate: string }

function NewScheduleForm() {
  const queryClient = useQueryClient()
  const [effectiveFrom, setEffectiveFrom] = useState('')
  const [cnpsEmployeeRate, setCnpsEmployeeRate] = useState('0.042')
  const [cnpsEmployerRate, setCnpsEmployerRate] = useState('0.07')
  const [cnpsCeilingXaf, setCnpsCeilingXaf] = useState('750000')
  const [standardDeductionRate, setStandardDeductionRate] = useState('0.30')
  const [brackets, setBrackets] = useState<BracketRow[]>([
    { upToXaf: '2000000', rate: '0.10' },
    { upToXaf: '', rate: '0.35' },
  ])
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      createPayrollSchedule({
        effectiveFrom,
        cnpsEmployeeRate,
        cnpsEmployerRate,
        cnpsCeilingXaf: Number(cnpsCeilingXaf),
        standardDeductionRate,
        irppBrackets: brackets.map((bracket) => ({
          upToXaf: bracket.upToXaf.trim() === '' ? null : Number(bracket.upToXaf),
          rate: bracket.rate,
        })),
      }),
    onSuccess: async () => {
      setError(null)
      await queryClient.invalidateQueries({ queryKey: ['hr', 'payroll-schedules'] })
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not create schedule'),
  })

  function updateBracket(index: number, patch: Partial<BracketRow>) {
    setBrackets((current) =>
      current.map((bracket, i) => (i === index ? { ...bracket, ...patch } : bracket)),
    )
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        mutation.mutate()
      }}
      className="mt-4"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <FormField label="Effective from" htmlFor="schedule-effective">
          <Input
            id="schedule-effective"
            type="date"
            value={effectiveFrom}
            onChange={(e) => setEffectiveFrom(e.target.value)}
            required
          />
        </FormField>
        <FormField label="CNPS employee rate" htmlFor="schedule-cnps-employee">
          <Input
            id="schedule-cnps-employee"
            value={cnpsEmployeeRate}
            onChange={(e) => setCnpsEmployeeRate(e.target.value)}
            required
          />
        </FormField>
        <FormField label="CNPS employer rate" htmlFor="schedule-cnps-employer">
          <Input
            id="schedule-cnps-employer"
            value={cnpsEmployerRate}
            onChange={(e) => setCnpsEmployerRate(e.target.value)}
            required
          />
        </FormField>
        <FormField label="CNPS ceiling (XAF)" htmlFor="schedule-ceiling">
          <Input
            id="schedule-ceiling"
            type="number"
            min={0}
            value={cnpsCeilingXaf}
            onChange={(e) => setCnpsCeilingXaf(e.target.value)}
            required
          />
        </FormField>
        <FormField label="Standard deduction" htmlFor="schedule-deduction">
          <Input
            id="schedule-deduction"
            value={standardDeductionRate}
            onChange={(e) => setStandardDeductionRate(e.target.value)}
            required
          />
        </FormField>
      </div>

      <fieldset className="mt-5">
        <legend className="text-sm font-medium text-text">IRPP brackets</legend>
        <p className="mt-1 text-sm text-muted">
          Leave the last “up to” blank - that bracket covers everything above the previous band.
        </p>
        <div className="mt-3 space-y-2">
          {brackets.map((bracket, index) => (
            <div key={index} className="grid gap-3 sm:grid-cols-3 sm:items-end">
              <FormField label={`Up to (XAF)`} htmlFor={`bracket-upto-${index}`}>
                <Input
                  id={`bracket-upto-${index}`}
                  type="number"
                  min={0}
                  value={bracket.upToXaf}
                  placeholder="No upper limit"
                  onChange={(e) => updateBracket(index, { upToXaf: e.target.value })}
                />
              </FormField>
              <FormField label="Rate" htmlFor={`bracket-rate-${index}`}>
                <Input
                  id={`bracket-rate-${index}`}
                  value={bracket.rate}
                  onChange={(e) => updateBracket(index, { rate: e.target.value })}
                  required
                />
              </FormField>
              {brackets.length > 1 ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setBrackets((current) => current.filter((_, i) => i !== index))}
                >
                  Remove band
                </Button>
              ) : null}
            </div>
          ))}
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="mt-3"
          onClick={() => setBrackets((current) => [...current, { upToXaf: '', rate: '0.00' }])}
        >
          Add band
        </Button>
      </fieldset>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" isLoading={mutation.isPending}>
          Create schedule version
        </Button>
        <p className="text-sm text-muted">Created unverified - another admin must verify it.</p>
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-xs text-error">
          {error}
        </p>
      ) : null}
    </form>
  )
}

function RunPayslips({ runId }: { runId: string }) {
  const employeeName = useEmployeeNames()
  const payslipsQuery = useQuery({
    queryKey: ['hr', 'run-payslips', runId],
    queryFn: () => fetchRunPayslips(runId),
  })

  if (payslipsQuery.isPending) {
    return (
      <div className="mt-3">
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }
  if (payslipsQuery.isError) {
    return (
      <div className="mt-3">
        <ErrorState message="Could not load payslips." />
      </div>
    )
  }
  if (payslipsQuery.data.length === 0) {
    return <p className="mt-3 text-sm text-muted">This run produced no payslips.</p>
  }

  const totalNet = payslipsQuery.data.reduce((sum, payslip) => sum + payslip.netXaf, 0)

  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <caption className="sr-only">Payslips in this run</caption>
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
            <th scope="col" className="py-2 pr-4 font-medium">Employee</th>
            <th scope="col" className="py-2 pr-4 font-medium">Gross</th>
            <th scope="col" className="py-2 pr-4 font-medium">CNPS</th>
            <th scope="col" className="py-2 pr-4 font-medium">Taxable</th>
            <th scope="col" className="py-2 pr-4 font-medium">IRPP</th>
            <th scope="col" className="py-2 font-medium">Net</th>
          </tr>
        </thead>
        <tbody>
          {payslipsQuery.data.map((payslip) => (
            <tr key={payslip.id} className="border-b border-border/60">
              <td className="py-2 pr-4 text-text">{employeeName(payslip.employeeId)}</td>
              <td className="py-2 pr-4 tabular-nums text-muted">{formatXaf(payslip.grossXaf)}</td>
              <td className="py-2 pr-4 tabular-nums text-muted">{formatXaf(payslip.cnpsEmployeeXaf)}</td>
              <td className="py-2 pr-4 tabular-nums text-muted">{formatXaf(payslip.taxableBaseXaf)}</td>
              <td className="py-2 pr-4 tabular-nums text-muted">{formatXaf(payslip.irppXaf)}</td>
              <td className="py-2 tabular-nums text-text">{formatXaf(payslip.netXaf)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="py-2 pr-4 text-xs uppercase tracking-wide text-muted" colSpan={5}>
              Total net
            </td>
            <td className="py-2 tabular-nums text-text">{formatXaf(totalNet)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function SchedulesSection({ schedules }: { schedules: PayrollSchedule[] }) {
  const { principal } = useAuth()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (scheduleId: string) => verifyPayrollSchedule(scheduleId),
    onSuccess: async () => {
      setError(null)
      await queryClient.invalidateQueries({ queryKey: ['hr', 'payroll-schedules'] })
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not verify schedule'),
  })

  if (schedules.length === 0) {
    return (
      <div className="mt-4">
        <EmptyState title="No schedule versions" message="Create the first one above." />
      </div>
    )
  }

  return (
    <>
      {error ? (
        <p role="alert" className="mt-2 text-xs text-error">
          {error}
        </p>
      ) : null}
      <ul className="mt-4 space-y-3">
        {schedules.map((schedule) => {
          const isOwnSchedule = schedule.createdBy != null && schedule.createdBy === principal?.id
          return (
            <li
              key={schedule.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-elevated p-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-text">Effective {schedule.effectiveFrom}</p>
                <p className="mt-0.5 text-sm text-muted">
                  CNPS {schedule.cnpsEmployeeRate} employee / {schedule.cnpsEmployerRate} employer · ceiling{' '}
                  {formatXaf(schedule.cnpsCeilingXaf)}
                </p>
                {!schedule.isVerified && isOwnSchedule ? (
                  <p className="mt-1 text-sm text-warning">
                    You created this schedule, so another admin has to verify it.
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    schedule.isVerified ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                  }`}
                >
                  {schedule.isVerified ? 'verified' : 'unverified'}
                </span>
                {!schedule.isVerified ? (
                  <Button
                    size="sm"
                    disabled={isOwnSchedule}
                    onClick={() => mutation.mutate(schedule.id)}
                    isLoading={mutation.isPending && mutation.variables === schedule.id}
                  >
                    Verify
                  </Button>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
      <p className="mt-3 text-sm text-muted">
        A schedule must be verified by a different admin than the one who wrote it, so the person who
        sets the rates never also releases pay against them.
      </p>
    </>
  )
}

export function PayrollPanel() {
  const queryClient = useQueryClient()
  const [period, setPeriod] = useState('')
  const [scheduleId, setScheduleId] = useState('')
  const [runError, setRunError] = useState<string | null>(null)
  const [approveError, setApproveError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const schedulesQuery = useQuery({
    queryKey: ['hr', 'payroll-schedules'],
    queryFn: fetchPayrollSchedules,
  })
  const runsQuery = useQuery({ queryKey: ['hr', 'payroll-runs'], queryFn: fetchPayrollRuns })

  const createRunMutation = useMutation({
    mutationFn: () => createPayrollRun({ period: `${period}-01`, scheduleVersionId: scheduleId }),
    onSuccess: async () => {
      setRunError(null)
      await queryClient.invalidateQueries({ queryKey: ['hr', 'payroll-runs'] })
    },
    onError: (err) => setRunError(err instanceof Error ? err.message : 'Could not create run'),
  })

  const approveMutation = useMutation({
    mutationFn: (runId: string) => approvePayrollRun(runId),
    onSuccess: async () => {
      setApproveError(null)
      await queryClient.invalidateQueries({ queryKey: ['hr', 'payroll-runs'] })
    },
    onError: (err) => setApproveError(err instanceof Error ? err.message : 'Could not approve run'),
  })

  const schedules = schedulesQuery.data ?? []
  const scheduleLabels = new Map(
    schedules.map((schedule) => [
      schedule.id,
      `${schedule.effectiveFrom}${schedule.isVerified ? '' : ' (unverified)'}`,
    ]),
  )

  return (
    <div>
      <section>
        <h2 className="text-sm font-medium text-text">New schedule version</h2>
        <p className="mt-1 text-sm text-muted">
          Rates are versioned rather than edited, so an approved run always points at the exact figures
          used to compute it.
        </p>
        <NewScheduleForm />
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-text">Schedule versions</h2>
        {schedulesQuery.isPending ? (
          <div className="mt-4">
            <Skeleton className="h-20 w-full" />
          </div>
        ) : schedulesQuery.isError ? (
          <div className="mt-4">
            <ErrorState message="Could not load schedules." />
          </div>
        ) : (
          <SchedulesSection schedules={schedules} />
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-text">Generate a run</h2>
        <p className="mt-1 text-sm text-muted">
          A run drafts one payslip per active employee. One run per period - a repeat is rejected rather
          than paying twice.
        </p>
        {schedules.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="Create a schedule first" message="A run must reference a rate version." />
          </div>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              createRunMutation.mutate()
            }}
            className="mt-4 grid gap-3 sm:grid-cols-3 sm:items-end"
          >
            <FormField label="Period" htmlFor="run-period">
              <Input
                id="run-period"
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Schedule version" htmlFor="run-schedule">
              <select
                id="run-schedule"
                value={scheduleId}
                onChange={(e) => setScheduleId(e.target.value)}
                required
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
              >
                <option value="">Select…</option>
                {schedules.map((schedule) => (
                  <option key={schedule.id} value={schedule.id}>
                    {scheduleLabels.get(schedule.id)}
                  </option>
                ))}
              </select>
            </FormField>
            <Button type="submit" size="sm" isLoading={createRunMutation.isPending}>
              Generate run
            </Button>
            {runError ? (
              <p role="alert" className="text-xs text-error sm:col-span-3">
                {runError}
              </p>
            ) : null}
          </form>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-text">Runs</h2>
        {approveError ? (
          <p role="alert" className="mt-2 text-xs text-error">
            {approveError}
          </p>
        ) : null}
        {runsQuery.isPending ? (
          <div className="mt-4">
            <Skeleton className="h-24 w-full" />
          </div>
        ) : runsQuery.isError ? (
          <div className="mt-4">
            <ErrorState message="Could not load payroll runs." />
          </div>
        ) : runsQuery.data.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No runs yet" message="Generate the first one above." />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {runsQuery.data.map((run) => {
              const schedule = schedules.find((candidate) => candidate.id === run.scheduleVersionId)
              const blocked = schedule ? !schedule.isVerified : false
              return (
                <li key={run.id} className="rounded-lg border border-border bg-surface-elevated p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text">{run.period.slice(0, 7)}</p>
                      <p className="mt-0.5 text-sm text-muted">
                        Rates effective {schedule?.effectiveFrom ?? 'unknown'}
                        {run.approvedAt
                          ? ` · approved ${new Date(run.approvedAt).toLocaleDateString()}`
                          : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          run.status === 'approved'
                            ? 'bg-success/10 text-success'
                            : 'bg-warning/10 text-warning'
                        }`}
                      >
                        {run.status}
                      </span>
                      {run.status === 'draft' ? (
                        <Button
                          size="sm"
                          disabled={blocked}
                          onClick={() => approveMutation.mutate(run.id)}
                          isLoading={approveMutation.isPending && approveMutation.variables === run.id}
                        >
                          Approve
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setExpanded(expanded === run.id ? null : run.id)}
                      >
                        {expanded === run.id ? 'Hide payslips' : 'Payslips'}
                      </Button>
                    </div>
                  </div>
                  {blocked && run.status === 'draft' ? (
                    <p className="mt-2 text-sm text-warning">
                      Approval is blocked until another admin verifies this run’s schedule version.
                    </p>
                  ) : null}
                  {expanded === run.id ? <RunPayslips runId={run.id} /> : null}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
