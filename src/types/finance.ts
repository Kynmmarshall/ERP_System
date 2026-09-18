export type Invoice = {
  id: string
  enrollmentId: string
  studentId: string
  amountXaf: number
  status: 'pending' | 'paid'
  createdAt: string
}

export type PaymentIntent = {
  id: string
  invoiceId: string
  amountXaf: number
  provider: string
  providerReference: string
  redirectUrl: string | null
  status: 'pending' | 'succeeded' | 'failed'
  createdAt: string
}

export type Expense = {
  id: string
  category: string
  amountXaf: number
  description: string
  recordedBy: string
  createdAt: string
}

export type LedgerEntry = {
  id: string
  postingId: string
  entryType: string
  direction: string
  amountXaf: number
  referenceType: string
  referenceId: string
  description: string
  createdAt: string
}

export type Campaign = {
  id: string
  name: string
  costXaf: number
  startsOn: string
  endsOn: string
}

export type Lead = {
  id: string
  campaignId: string
  status: string
  studentId: string | null
}

export type CampaignRoi = {
  campaignId: string
  costXaf: number
  attributedRevenueXaf: number
  /** Null when ROI genuinely cannot be computed (e.g. zero spend) - never
   * substitute 0, see roiUnavailableReason. */
  roi: number | null
  roiUnavailableReason: string | null
}

export type FinancialSummary = {
  id: string
  period: string
  version: number
  totalRevenueXaf: number
  totalExpensesXaf: number
  netXaf: number
  generatedAt: string
}
