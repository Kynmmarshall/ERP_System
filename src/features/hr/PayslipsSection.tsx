import { useQuery } from '@tanstack/react-query'

import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { fetchMyPayslips } from '@/services/hrService'

function formatXaf(amount: number): string {
  return `${amount.toLocaleString('en-US')} XAF`
}

export function PayslipsSection() {
  const payslipsQuery = useQuery({ queryKey: ['my-payslips'], queryFn: fetchMyPayslips })

  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight text-text">Payslips</h2>
      <div className="mt-3">
        {payslipsQuery.isError ? (
          <ErrorState message="Could not load your payslips." />
        ) : payslipsQuery.isPending ? (
          <Skeleton className="h-16 w-full" />
        ) : payslipsQuery.data.length === 0 ? (
          <EmptyState
            title="No payslips yet"
            message="Payslips appear here once a payroll run for your period is approved."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {payslipsQuery.data.map((payslip) => (
              <div key={payslip.id} className="rounded-lg border border-border bg-surface p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-text">{payslip.period}</p>
                  <p className="text-sm font-medium text-text">{formatXaf(payslip.netXaf)} net</p>
                </div>
                <p className="mt-1 text-xs text-muted">
                  Gross {formatXaf(payslip.grossXaf)} · CNPS {formatXaf(payslip.cnpsEmployeeXaf)} · IRPP{' '}
                  {formatXaf(payslip.irppXaf)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
