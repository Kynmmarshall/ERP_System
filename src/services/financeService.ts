import { authFetchJson } from '@/services/apiClient'
import type { Invoice } from '@/types/finance'

type InvoiceResponse = {
  id: string
  enrollment_id: string
  student_id: string
  amount_xaf: number
  status: 'pending' | 'paid'
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

/** Returns null while finance's consumer hasn't produced an invoice for this
 * enrollment yet - callers poll (see EnrollmentPage) rather than treating
 * this as an error. */
export async function fetchInvoiceForEnrollment(enrollmentId: string): Promise<Invoice | null> {
  const body = await authFetchJson<InvoiceResponse[]>(
    `/api/v1/finance/invoices?enrollment_id=${encodeURIComponent(enrollmentId)}`,
  )
  return body.length > 0 ? toInvoice(body[0]) : null
}
