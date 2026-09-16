import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/AuthContext'
import { fetchCourseOfferings, fetchCourses, fetchTerms } from '@/services/academicService'
import type { CourseOffering } from '@/types/academic'

export type OfferingOption = { offering: CourseOffering; label: string }

/** Offerings carry only ids, so a usable picker has to join course + term
 * client-side - there is no denormalised listing endpoint.
 *
 * Staff are additionally narrowed to offerings they actually instruct: the API
 * rejects grading/attendance/at-risk on anyone else's offering
 * (ensure_can_manage_offering), so listing them here would only hand the user a
 * guaranteed 403. Admins legitimately manage all of them. */
export function useOfferingOptions() {
  const { principal } = useAuth()
  const coursesQuery = useQuery({ queryKey: ['courses'], queryFn: fetchCourses })
  const offeringsQuery = useQuery({ queryKey: ['course-offerings'], queryFn: fetchCourseOfferings })
  const termsQuery = useQuery({ queryKey: ['terms'], queryFn: fetchTerms })

  const isPending = coursesQuery.isPending || offeringsQuery.isPending || termsQuery.isPending
  const isError = coursesQuery.isError || offeringsQuery.isError || termsQuery.isError

  const visibleOfferings =
    isPending || isError
      ? []
      : principal?.role === 'staff'
        ? offeringsQuery.data.filter((offering) => offering.instructorId === principal.id)
        : offeringsQuery.data

  const options: OfferingOption[] =
    isPending || isError
      ? []
      : visibleOfferings.map((offering) => {
          const course = coursesQuery.data.find((c) => c.id === offering.courseId)
          const term = termsQuery.data.find((t) => t.id === offering.termId)
          const courseLabel = course ? `${course.code} — ${course.name}` : 'Unknown course'
          return { offering, label: term ? `${courseLabel} (${term.name})` : courseLabel }
        })

  return { options, isPending, isError, terms: termsQuery.data ?? [] }
}
