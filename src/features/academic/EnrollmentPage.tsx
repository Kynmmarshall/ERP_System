import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { FormField } from '@/components/ui/FormField'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/features/auth/AuthContext'
import { CoursesPanel } from '@/features/academic/CoursesPanel'
import { StaffAcademicPage } from '@/features/academic/staff/StaffAcademicPage'
import {
  createEnrollment,
  fetchEnrollments,
  fetchPrograms,
  fetchTerms,
} from '@/services/academicService'
import { fetchInvoiceForEnrollment } from '@/services/financeService'
import type { Enrollment, Program, Term } from '@/types/academic'

const enrollmentSchema = z.object({
  programId: z.string().min(1, 'Select a program'),
  termId: z.string().min(1, 'Select a term'),
})

type EnrollmentFormValues = z.infer<typeof enrollmentSchema>

const selectClassName =
  'h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus:border-primary/60'

function InvoiceCell({ enrollmentId, poll }: { enrollmentId: string; poll: boolean }) {
  const query = useQuery({
    queryKey: ['invoice', enrollmentId],
    queryFn: () => fetchInvoiceForEnrollment(enrollmentId),
    refetchInterval: (q) => (poll && !q.state.data ? 2000 : false),
  })

  if (query.isPending) {
    return <Skeleton className="h-4 w-24" />
  }
  if (query.isError) {
    return <span className="text-xs text-error">Could not load</span>
  }
  if (!query.data) {
    return <span className="text-xs text-muted">Pending…</span>
  }
  return (
    <span className="text-sm text-text">
      {query.data.amountXaf.toLocaleString('en-US')} XAF · {query.data.status}
    </span>
  )
}

function EnrollmentTable({
  enrollments,
  programsById,
  termsById,
  justCreatedId,
}: {
  enrollments: Enrollment[]
  programsById: Map<string, Program>
  termsById: Map<string, Term>
  justCreatedId: string | null
}) {
  if (enrollments.length === 0) {
    return <EmptyState title="No enrollments yet" message="Enroll in a program and term above to get started." />
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Program</th>
            <th className="px-4 py-3 font-medium">Term</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Invoice</th>
          </tr>
        </thead>
        <tbody>
          {enrollments.map((enrollment) => (
            <tr key={enrollment.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3 text-text">
                {programsById.get(enrollment.programId)?.name ?? enrollment.programId}
              </td>
              <td className="px-4 py-3 text-text">
                {termsById.get(enrollment.termId)?.name ?? enrollment.termId}
              </td>
              <td className="px-4 py-3 text-muted">{enrollment.status}</td>
              <td className="px-4 py-3">
                <InvoiceCell enrollmentId={enrollment.id} poll={enrollment.id === justCreatedId} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function EnrollmentPage() {
  const { principal } = useAuth()
  const queryClient = useQueryClient()
  const [justCreatedId, setJustCreatedId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const programsQuery = useQuery({ queryKey: ['programs'], queryFn: fetchPrograms })
  const termsQuery = useQuery({ queryKey: ['terms'], queryFn: fetchTerms })
  const enrollmentsQuery = useQuery({ queryKey: ['enrollments'], queryFn: fetchEnrollments })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EnrollmentFormValues>({ resolver: zodResolver(enrollmentSchema) })

  const enrollMutation = useMutation({
    mutationFn: (values: EnrollmentFormValues) =>
      createEnrollment({
        programId: values.programId,
        termId: values.termId,
      }),
    onSuccess: async (enrollment) => {
      setJustCreatedId(enrollment.id)
      await queryClient.invalidateQueries({ queryKey: ['enrollments'] })
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await enrollMutation.mutateAsync(values)
      reset()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Enrollment failed')
    }
  })

  if (principal?.role !== 'student') {
    return <StaffAcademicPage />
  }

  const programsById = new Map((programsQuery.data ?? []).map((program) => [program.id, program]))
  const termsById = new Map((termsQuery.data ?? []).map((term) => [term.id, term]))

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">Academic</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text">Enroll in a program</h1>

      {programsQuery.isError || termsQuery.isError ? (
        <div className="mt-8">
          <ErrorState message="Could not load programs and terms. Please try again later." />
        </div>
      ) : programsQuery.isPending || termsQuery.isPending ? (
        <div className="mt-8 flex flex-col gap-3">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-5 sm:max-w-md">
          <FormField label="Program" htmlFor="programId" error={errors.programId?.message}>
            <select id="programId" className={selectClassName} {...register('programId')}>
              <option value="">Select a program</option>
              {programsQuery.data.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name} ({program.code})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Term" htmlFor="termId" error={errors.termId?.message}>
            <select id="termId" className={selectClassName} {...register('termId')}>
              <option value="">Select a term</option>
              {termsQuery.data.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name}
                </option>
              ))}
            </select>
          </FormField>

          {formError ? (
            <p role="alert" className="text-sm text-error">
              {formError}
            </p>
          ) : null}

          <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-fit">
            Enroll
          </Button>
        </form>
      )}

      <h2 className="mt-12 text-lg font-semibold tracking-tight text-text">My enrollments</h2>
      <div className="mt-4">
        {enrollmentsQuery.isError ? (
          <ErrorState message="Could not load your enrollments." />
        ) : enrollmentsQuery.isPending ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <EnrollmentTable
            enrollments={enrollmentsQuery.data}
            programsById={programsById}
            termsById={termsById}
            justCreatedId={justCreatedId}
          />
        )}
      </div>

      {enrollmentsQuery.data && enrollmentsQuery.data.length > 0 ? (
        <CoursesPanel enrollments={enrollmentsQuery.data} />
      ) : null}
    </div>
  )
}
