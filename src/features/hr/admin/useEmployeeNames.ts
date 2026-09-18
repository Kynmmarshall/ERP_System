import { useQuery } from '@tanstack/react-query'

import { fetchEmployees } from '@/services/hrService'

export function useEmployees() {
  return useQuery({ queryKey: ['hr', 'employees'], queryFn: fetchEmployees })
}

/** Payroll, shifts and reviews all return employee_id only; this keeps the
 *  fallback honest by showing a short id rather than inventing a name. */
export function useEmployeeNames() {
  const query = useEmployees()
  const names = new Map((query.data ?? []).map((employee) => [employee.id, employee.fullName]))
  return (employeeId: string) => names.get(employeeId) ?? `Employee ${employeeId.slice(0, 8)}`
}
