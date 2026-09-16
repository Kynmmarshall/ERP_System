import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatXaf } from '@/lib/currency'
import { fetchExpenses, recordExpense } from '@/services/financeService'

export function ExpensesPanel() {
  const queryClient = useQueryClient()
  const [category, setCategory] = useState('')
  const [amountXaf, setAmountXaf] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  const expensesQuery = useQuery({ queryKey: ['expenses'], queryFn: fetchExpenses })

  const mutation = useMutation({
    mutationFn: () => recordExpense({ category, amountXaf: Number(amountXaf), description }),
    onSuccess: async () => {
      setCategory('')
      setAmountXaf('')
      setDescription('')
      setError(null)
      await queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not record expense'),
  })

  const total = expensesQuery.data?.reduce((sum, expense) => sum + expense.amountXaf, 0) ?? 0

  return (
    <div>
      <section>
        <h2 className="text-sm font-medium text-text">Record an expense</h2>
        <p className="mt-1 text-sm text-muted">
          Expenses are append-only: there is no edit or delete, corrections are new entries.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            mutation.mutate()
          }}
          className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
        >
          <FormField label="Category" htmlFor="expense-category">
            <Input
              id="expense-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Utilities"
              required
            />
          </FormField>
          <FormField label="Amount (XAF)" htmlFor="expense-amount">
            <Input
              id="expense-amount"
              type="number"
              min={0}
              value={amountXaf}
              onChange={(e) => setAmountXaf(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Description" htmlFor="expense-description">
            <Input
              id="expense-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </FormField>
          <Button type="submit" size="sm" isLoading={mutation.isPending}>
            Record expense
          </Button>
          {error ? (
            <p role="alert" className="text-xs text-error sm:col-span-2 lg:col-span-4">
              {error}
            </p>
          ) : null}
        </form>
      </section>

      <section className="mt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-medium text-text">Recorded expenses</h2>
          {expensesQuery.data && expensesQuery.data.length > 0 ? (
            <p className="text-sm text-muted">
              Total <span className="tabular-nums text-text">{formatXaf(total)}</span>
            </p>
          ) : null}
        </div>

        {expensesQuery.isPending ? (
          <div className="mt-4">
            <Skeleton className="h-24 w-full" />
          </div>
        ) : expensesQuery.isError ? (
          <div className="mt-4">
            <ErrorState message="Could not load expenses." />
          </div>
        ) : expensesQuery.data.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No expenses recorded" message="Add the first one above." />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-left text-sm">
              <caption className="sr-only">Recorded expenses</caption>
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                  <th scope="col" className="py-2 pr-4 font-medium">Category</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Amount</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Description</th>
                  <th scope="col" className="py-2 font-medium">Recorded</th>
                </tr>
              </thead>
              <tbody>
                {expensesQuery.data.map((expense) => (
                  <tr key={expense.id} className="border-b border-border/60">
                    <td className="py-2 pr-4 text-text">{expense.category}</td>
                    <td className="py-2 pr-4 tabular-nums text-muted">{formatXaf(expense.amountXaf)}</td>
                    <td className="py-2 pr-4 text-muted">{expense.description}</td>
                    <td className="py-2 text-muted">
                      {new Date(expense.createdAt).toLocaleDateString()}
                    </td>
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
