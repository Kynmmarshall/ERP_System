import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import {
  createPaymentIntent,
  downloadReceipt,
  fetchPaymentIntent,
} from '@/services/financeService'
import type { Invoice } from '@/types/finance'

function formatXaf(amount: number): string {
  return `${amount.toLocaleString('en-US')} XAF`
}

function PayForm({ invoice, onPaid }: { invoice: Invoice; onPaid: () => void }) {
  const pendingIntentKey = `camerpay-pending-intent:${invoice.id}`
  const [payerMsisdn, setPayerMsisdn] = useState('')
  // Resumes tracking an intent still pending from before a CamerPay hosted-
  // page redirect trip (see onSuccess below) - a fresh page load otherwise
  // has no memory of it.
  const [intentId, setIntentId] = useState<string | null>(() => sessionStorage.getItem(pendingIntentKey))
  const [error, setError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: () => createPaymentIntent(invoice.id, payerMsisdn),
    onSuccess: (intent) => {
      setIntentId(intent.id)
      if (intent.redirectUrl) {
        // Hosted-checkout provider (camerpay): remember which intent to
        // resume polling once the customer's browser comes back.
        sessionStorage.setItem(pendingIntentKey, intent.id)
        window.location.href = intent.redirectUrl
      }
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not start payment'),
  })

  const intentQuery = useQuery({
    queryKey: ['payment-intent', intentId],
    queryFn: () => fetchPaymentIntent(intentId!),
    enabled: intentId !== null,
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 1500 : false),
  })

  if (intentQuery.data?.status === 'succeeded') {
    sessionStorage.removeItem(pendingIntentKey)
    onPaid()
    return <p className="text-sm text-success">Payment succeeded.</p>
  }

  if (intentId !== null) {
    if (intentQuery.data?.status === 'failed') {
      sessionStorage.removeItem(pendingIntentKey)
    }
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted">
          {intentQuery.data?.status === 'failed' ? 'Payment failed.' : 'Waiting for CamerPay confirmation…'}
        </p>
        {intentQuery.data?.status === 'failed' ? (
          <Button size="sm" variant="secondary" onClick={() => setIntentId(null)} className="w-fit">
            Try again
          </Button>
        ) : null}
      </div>
    )
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        setError(null)
        createMutation.mutate()
      }}
      className="flex flex-col gap-2 sm:flex-row sm:items-end"
    >
      <FormField label="Mobile money number" htmlFor={`msisdn-${invoice.id}`}>
        <Input
          id={`msisdn-${invoice.id}`}
          value={payerMsisdn}
          onChange={(event) => setPayerMsisdn(event.target.value)}
          placeholder="6XXXXXXXX"
          required
        />
      </FormField>
      <Button type="submit" size="sm" isLoading={createMutation.isPending}>
        Pay with CamerPay
      </Button>
      {error ? (
        <p role="alert" className="text-xs text-error">
          {error}
        </p>
      ) : null}
    </form>
  )
}

function InvoiceRow({ invoice, onPaid }: { invoice: Invoice; onPaid: () => void }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-text">{formatXaf(invoice.amountXaf)}</p>
        <span className="text-xs uppercase tracking-wide text-muted">{invoice.status}</span>
      </div>
      <div className="mt-3">
        {invoice.status === 'pending' ? (
          <PayForm invoice={invoice} onPaid={onPaid} />
        ) : (
          <Button size="sm" variant="secondary" onClick={() => downloadReceipt(invoice.id)}>
            Download receipt
          </Button>
        )}
      </div>
    </div>
  )
}

export { InvoiceRow }
