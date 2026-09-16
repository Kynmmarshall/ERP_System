import { useQuery } from '@tanstack/react-query'

import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatXaf } from '@/features/finance/staff/format'
import { fetchLedgerEntries, fetchSummaries } from '@/services/financeService'

function SummaryCard({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' }) {
  const valueClass =
    tone === 'good' ? 'text-success' : tone === 'bad' ? 'text-error' : 'text-text'
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted">{label}</p>
      <p className={`mt-2 text-xl font-semibold tabular-nums ${valueClass}`}>{value}</p>
    </div>
  )
}

export function FinancialOverviewPanel() {
  const summariesQuery = useQuery({ queryKey: ['summaries'], queryFn: fetchSummaries })
  const ledgerQuery = useQuery({ queryKey: ['ledger-entries'], queryFn: fetchLedgerEntries })

  if (summariesQuery.isPending || ledgerQuery.isPending) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }
  if (summariesQuery.isError || ledgerQuery.isError) {
    return <ErrorState message="Could not load financial data." />
  }

  // Summaries are versioned per period; the highest version is the current one.
  const latestByPeriod = new Map<string, (typeof summariesQuery.data)[number]>()
  for (const summary of summariesQuery.data) {
    const existing = latestByPeriod.get(summary.period)
    if (!existing || summary.version > existing.version) latestByPeriod.set(summary.period, summary)
  }
  const periods = [...latestByPeriod.values()].sort((a, b) => b.period.localeCompare(a.period))
  const latest = periods[0]

  return (
    <div>
      <section>
        <h2 className="text-sm font-medium text-text">
          {latest ? `Latest month (${latest.period})` : 'Monthly summary'}
        </h2>
        {latest ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <SummaryCard label="Revenue" value={formatXaf(latest.totalRevenueXaf)} tone="good" />
            <SummaryCard label="Expenses" value={formatXaf(latest.totalExpensesXaf)} tone="bad" />
            <SummaryCard
              label="Net"
              value={formatXaf(latest.netXaf)}
              tone={latest.netXaf >= 0 ? 'good' : 'bad'}
            />
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState
              title="No monthly summary yet"
              message="The finance worker generates these on a schedule; a super admin can also regenerate a period on demand."
            />
          </div>
        )}
      </section>

      {periods.length > 1 ? (
        <section className="mt-10">
          <h2 className="text-sm font-medium text-text">Monthly history</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <caption className="sr-only">Monthly financial summaries</caption>
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                  <th scope="col" className="py-2 pr-4 font-medium">Period</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Revenue</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Expenses</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Net</th>
                  <th scope="col" className="py-2 font-medium">Version</th>
                </tr>
              </thead>
              <tbody>
                {periods.map((summary) => (
                  <tr key={summary.id} className="border-b border-border/60">
                    <td className="py-2 pr-4 text-text">{summary.period}</td>
                    <td className="py-2 pr-4 tabular-nums text-muted">{formatXaf(summary.totalRevenueXaf)}</td>
                    <td className="py-2 pr-4 tabular-nums text-muted">{formatXaf(summary.totalExpensesXaf)}</td>
                    <td className="py-2 pr-4 tabular-nums text-text">{formatXaf(summary.netXaf)}</td>
                    <td className="py-2 text-muted">v{summary.version}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="text-sm font-medium text-text">General ledger</h2>
        <p className="mt-1 text-sm text-muted">
          Double-entry postings. Every payment writes a balanced debit/credit pair.
        </p>
        {ledgerQuery.data.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No ledger entries yet" message="Entries appear once a payment settles." />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <caption className="sr-only">General ledger entries</caption>
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                  <th scope="col" className="py-2 pr-4 font-medium">Account</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Direction</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Amount</th>
                  <th scope="col" className="py-2 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {ledgerQuery.data.map((entry) => (
                  <tr key={entry.id} className="border-b border-border/60">
                    <td className="py-2 pr-4 text-text">{entry.entryType}</td>
                    <td className="py-2 pr-4 text-muted">{entry.direction}</td>
                    <td className="py-2 pr-4 tabular-nums text-muted">{formatXaf(entry.amountXaf)}</td>
                    <td className="py-2 text-muted">{entry.description}</td>
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
