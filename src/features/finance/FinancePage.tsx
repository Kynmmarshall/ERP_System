import { useQuery, useQueryClient } from '@tanstack/react-query'

import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/features/auth/AuthContext'
import { FINANCE_ROLES, hasRole } from '@/features/auth/roles'
import { InvoiceRow } from '@/features/finance/InvoiceRow'
import { StaffFinancePage } from '@/features/finance/staff/StaffFinancePage'
import { fetchMyInvoices } from '@/services/financeService'

export function FinancePage() {
  const { principal } = useAuth()
  const queryClient = useQueryClient()

  const invoicesQuery = useQuery({ queryKey: ['my-invoices'], queryFn: fetchMyInvoices })

  // Checked positively: an unrecognised role must not fall through to the
  // finance workspace.
  if (hasRole(principal?.role, FINANCE_ROLES)) {
    return <StaffFinancePage />
  }

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">Finance & Marketing</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text">My invoices</h1>

      <div className="mt-8">
        {invoicesQuery.isError ? (
          <ErrorState message="Could not load your invoices." />
        ) : invoicesQuery.isPending ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : invoicesQuery.data.length === 0 ? (
          <EmptyState title="No invoices yet" message="Invoices appear here once you enroll in a program." />
        ) : (
          <div className="flex flex-col gap-3">
            {invoicesQuery.data.map((invoice) => (
              <InvoiceRow
                key={invoice.id}
                invoice={invoice}
                onPaid={() => queryClient.invalidateQueries({ queryKey: ['my-invoices'] })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
