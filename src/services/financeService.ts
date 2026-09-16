import { authFetch, authFetchJson } from '@/services/apiClient'
import type {
  Campaign,
  CampaignRoi,
  Expense,
  FinancialSummary,
  Invoice,
  Lead,
  LedgerEntry,
  PaymentIntent,
} from '@/types/finance'

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

// --- Staff / admin operations ----------------------------------------------
// All role-gated server-side to admin/finance_staff (regenerate is
// admin only).

type ExpenseResponse = {
  id: string
  category: string
  amount_xaf: number
  description: string
  recorded_by: string
  created_at: string
}
type LedgerEntryResponse = {
  id: string
  posting_id: string
  entry_type: string
  direction: string
  amount_xaf: number
  reference_type: string
  reference_id: string
  description: string
  created_at: string
}
type CampaignResponse = {
  id: string
  name: string
  cost_xaf: number
  starts_on: string
  ends_on: string
}
type LeadResponse = { id: string; campaign_id: string; status: string; student_id: string | null }
type CampaignRoiResponse = {
  campaign_id: string
  cost_xaf: number
  attributed_revenue_xaf: number
  roi: number | null
  roi_unavailable_reason: string | null
}
type FinancialSummaryResponse = {
  id: string
  period: string
  version: number
  total_revenue_xaf: number
  total_expenses_xaf: number
  net_xaf: number
  generated_at: string
}

function toExpense(body: ExpenseResponse): Expense {
  return {
    id: body.id,
    category: body.category,
    amountXaf: body.amount_xaf,
    description: body.description,
    recordedBy: body.recorded_by,
    createdAt: body.created_at,
  }
}

function toLedgerEntry(body: LedgerEntryResponse): LedgerEntry {
  return {
    id: body.id,
    postingId: body.posting_id,
    entryType: body.entry_type,
    direction: body.direction,
    amountXaf: body.amount_xaf,
    referenceType: body.reference_type,
    referenceId: body.reference_id,
    description: body.description,
    createdAt: body.created_at,
  }
}

function toCampaign(body: CampaignResponse): Campaign {
  return {
    id: body.id,
    name: body.name,
    costXaf: body.cost_xaf,
    startsOn: body.starts_on,
    endsOn: body.ends_on,
  }
}

function toLead(body: LeadResponse): Lead {
  return {
    id: body.id,
    campaignId: body.campaign_id,
    status: body.status,
    studentId: body.student_id,
  }
}

function toCampaignRoi(body: CampaignRoiResponse): CampaignRoi {
  return {
    campaignId: body.campaign_id,
    costXaf: body.cost_xaf,
    attributedRevenueXaf: body.attributed_revenue_xaf,
    roi: body.roi,
    roiUnavailableReason: body.roi_unavailable_reason,
  }
}

function toFinancialSummary(body: FinancialSummaryResponse): FinancialSummary {
  return {
    id: body.id,
    period: body.period,
    version: body.version,
    totalRevenueXaf: body.total_revenue_xaf,
    totalExpensesXaf: body.total_expenses_xaf,
    netXaf: body.net_xaf,
    generatedAt: body.generated_at,
  }
}

export async function fetchExpenses(): Promise<Expense[]> {
  const body = await authFetchJson<ExpenseResponse[]>('/api/v1/finance/expenses')
  return body.map(toExpense)
}

export async function recordExpense(input: {
  category: string
  amountXaf: number
  description: string
}): Promise<Expense> {
  const body = await authFetchJson<ExpenseResponse>('/api/v1/finance/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category: input.category,
      amount_xaf: input.amountXaf,
      description: input.description,
    }),
  })
  return toExpense(body)
}

export async function fetchLedgerEntries(): Promise<LedgerEntry[]> {
  const body = await authFetchJson<LedgerEntryResponse[]>('/api/v1/finance/ledger-entries')
  return body.map(toLedgerEntry)
}

export async function fetchCampaigns(): Promise<Campaign[]> {
  const body = await authFetchJson<CampaignResponse[]>('/api/v1/finance/campaigns')
  return body.map(toCampaign)
}

export async function createCampaign(input: {
  name: string
  costXaf: number
  startsOn: string
  endsOn: string
}): Promise<Campaign> {
  const body = await authFetchJson<CampaignResponse>('/api/v1/finance/campaigns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: input.name,
      cost_xaf: input.costXaf,
      starts_on: input.startsOn,
      ends_on: input.endsOn,
    }),
  })
  return toCampaign(body)
}

export async function fetchCampaignLeads(campaignId: string): Promise<Lead[]> {
  const body = await authFetchJson<LeadResponse[]>(
    `/api/v1/finance/campaigns/${encodeURIComponent(campaignId)}/leads`,
  )
  return body.map(toLead)
}

export async function createLead(campaignId: string): Promise<Lead> {
  const body = await authFetchJson<LeadResponse>(
    `/api/v1/finance/campaigns/${encodeURIComponent(campaignId)}/leads`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaign_id: campaignId }),
    },
  )
  return toLead(body)
}

export async function convertLead(leadId: string, studentId: string): Promise<Lead> {
  const body = await authFetchJson<LeadResponse>(
    `/api/v1/finance/leads/${encodeURIComponent(leadId)}/convert`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId }),
    },
  )
  return toLead(body)
}

export async function fetchCampaignRoi(campaignId: string): Promise<CampaignRoi> {
  const body = await authFetchJson<CampaignRoiResponse>(
    `/api/v1/finance/campaigns/${encodeURIComponent(campaignId)}/roi`,
  )
  return toCampaignRoi(body)
}

export async function fetchSummaries(): Promise<FinancialSummary[]> {
  const body = await authFetchJson<FinancialSummaryResponse[]>('/api/v1/finance/summaries')
  return body.map(toFinancialSummary)
}

export async function regenerateSummary(period: string): Promise<FinancialSummary> {
  const body = await authFetchJson<FinancialSummaryResponse>('/api/v1/finance/summaries/regenerate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ period }),
  })
  return toFinancialSummary(body)
}

export async function createFeeSchedule(input: {
  programId: string
  termId: string
  amountXaf: number
}): Promise<void> {
  await authFetchJson('/api/v1/finance/fee-schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      program_id: input.programId,
      term_id: input.termId,
      amount_xaf: input.amountXaf,
    }),
  })
}

