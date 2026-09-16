import { authFetch, authFetchJson } from '@/services/apiClient'
import type { Invoice, PaymentIntent } from '@/types/finance'

type InvoiceResponse = {
  id: string
  enrollment_id: string
  student_id: string
  amount_xaf: number
  status: 'pending' | 'paid'
  created_at: string
}

type PaymentIntentResponse = {
  id: string
  invoice_id: string
  amount_xaf: number
  provider: string
  provider_reference: string
  redirect_url: string | null
  status: 'pending' | 'succeeded' | 'failed'
  created_at: string
}

function toInvoice(body: InvoiceResponse): Invoice {
  return {
    id: body.id,
    enrollmentId: body.enrollment_id,
    studentId: body.student_id,
    amountXaf: body.amount_xaf,
    status: body.status,
    createdAt: body.created_at,
  }
}

function toPaymentIntent(body: PaymentIntentResponse): PaymentIntent {
  return {
    id: body.id,
    invoiceId: body.invoice_id,
    amountXaf: body.amount_xaf,
    provider: body.provider,
    providerReference: body.provider_reference,
    redirectUrl: body.redirect_url,
    status: body.status,
    createdAt: body.created_at,
  }
}

/** Returns null while finance's consumer hasn't produced an invoice for this
 * enrollment yet - callers poll (see EnrollmentPage) rather than treating
 * this as an error. */
export async function fetchInvoiceForEnrollment(enrollmentId: string): Promise<Invoice | null> {
  const body = await authFetchJson<InvoiceResponse[]>(
    `/api/v1/finance/invoices?enrollment_id=${encodeURIComponent(enrollmentId)}`,
  )
  return body.length > 0 ? toInvoice(body[0]) : null
}

export async function fetchMyInvoices(): Promise<Invoice[]> {
  const body = await authFetchJson<InvoiceResponse[]>('/api/v1/finance/invoices')
  return body.map(toInvoice)
}

export async function createPaymentIntent(invoiceId: string, payerMsisdn: string): Promise<PaymentIntent> {
  const body = await authFetchJson<PaymentIntentResponse>(
    `/api/v1/finance/invoices/${encodeURIComponent(invoiceId)}/payment-intents`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payer_msisdn: payerMsisdn }),
    },
  )
  return toPaymentIntent(body)
}

export async function fetchPaymentIntent(intentId: string): Promise<PaymentIntent> {
  const body = await authFetchJson<PaymentIntentResponse>(`/api/v1/finance/payment-intents/${intentId}`)
  return toPaymentIntent(body)
}

export async function downloadReceipt(invoiceId: string): Promise<void> {
  const response = await authFetch(`/api/v1/finance/invoices/${encodeURIComponent(invoiceId)}/receipt`)
  if (!response.ok) {
    throw new Error('Could not download receipt')
  }
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'receipt.pdf'
  link.click()
  URL.revokeObjectURL(url)
}

