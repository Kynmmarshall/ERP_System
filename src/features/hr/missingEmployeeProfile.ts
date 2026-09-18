import { ApiError } from '@/services/apiClient'

/** The HR self-service endpoints answer 404 when the signed-in user has no
 *  Employee row. That is a missing record, not a failure, so it should not
 *  be reported as "something went wrong". */
export function isMissingEmployeeProfile(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404
}
