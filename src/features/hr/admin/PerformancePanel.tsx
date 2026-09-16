import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { useEmployeeNames, useEmployees } from '@/features/hr/admin/useEmployeeNames'
import { createPerformanceReview, fetchPerformanceReviews } from '@/services/hrService'

const RATINGS = [1, 2, 3, 4, 5]

export function PerformancePanel() {
  const queryClient = useQueryClient()
  const employeesQuery = useEmployees()
  const employeeName = useEmployeeNames()
  const [employeeId, setEmployeeId] = useState('')
  const [period, setPeriod] = useState('')
  const [rating, setRating] = useState('3')
  const [comments, setComments] = useState('')
  const [error, setError] = useState<string | null>(null)

  const reviewsQuery = useQuery({ queryKey: ['hr', 'reviews'], queryFn: fetchPerformanceReviews })

  const mutation = useMutation({
    mutationFn: () =>
      createPerformanceReview({
        employeeId,
        period: `${period}-01`,
        rating: Number(rating),
        comments,
      }),
    onSuccess: async () => {
      setComments('')
      setError(null)
      await queryClient.invalidateQueries({ queryKey: ['hr', 'reviews'] })
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not save review'),
  })

  const employees = employeesQuery.data ?? []

  return (
    <div>
      <section>
        <h2 className="text-sm font-medium text-text">Record a review</h2>
        <p className="mt-1 text-sm text-muted">
          Reviews are recorded against you as the reviewer and cannot be edited afterwards.
        </p>
        {employees.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No employees yet"
              message="Hire a candidate under Recruitment before recording reviews."
            />
          </div>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              mutation.mutate()
            }}
            className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
          >
            <FormField label="Employee" htmlFor="review-employee">
              <select
                id="review-employee"
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
            <FormField label="Period" htmlFor="review-period">
              <Input
                id="review-period"
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Rating" htmlFor="review-rating">
              <select
                id="review-rating"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
              >
                {RATINGS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Comments" htmlFor="review-comments">
              <Input
                id="review-comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                required
              />
            </FormField>
            <Button type="submit" size="sm" isLoading={mutation.isPending}>
              Save review
            </Button>
            {error ? (
              <p role="alert" className="text-xs text-error sm:col-span-2 lg:col-span-5">
                {error}
              </p>
            ) : null}
          </form>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-text">Recorded reviews</h2>
        {reviewsQuery.isPending ? (
          <div className="mt-4">
            <Skeleton className="h-24 w-full" />
          </div>
        ) : reviewsQuery.isError ? (
          <div className="mt-4">
            <ErrorState message="Could not load reviews." />
          </div>
        ) : reviewsQuery.data.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No reviews recorded" message="Add the first one above." />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <caption className="sr-only">Performance reviews</caption>
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                  <th scope="col" className="py-2 pr-4 font-medium">Employee</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Period</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Rating</th>
                  <th scope="col" className="py-2 font-medium">Comments</th>
                </tr>
              </thead>
              <tbody>
                {reviewsQuery.data.map((review) => (
                  <tr key={review.id} className="border-b border-border/60">
                    <td className="py-2 pr-4 text-text">{employeeName(review.employeeId)}</td>
                    <td className="py-2 pr-4 text-muted">{review.period.slice(0, 7)}</td>
                    <td className="py-2 pr-4 tabular-nums text-muted">{review.rating} / 5</td>
                    <td className="py-2 text-muted">{review.comments}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
