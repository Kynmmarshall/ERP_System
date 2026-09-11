export type Invoice = {
  id: string
  enrollmentId: string
  studentId: string
  amountXaf: number
  status: 'pending' | 'paid'
  createdAt: string
}
