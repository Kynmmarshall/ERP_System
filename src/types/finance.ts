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
  status: 'pending' | 'succeeded' | 'failed'
  createdAt: string
}
