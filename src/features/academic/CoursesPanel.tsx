import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { CourseGrades } from '@/features/academic/CourseGrades'
import {
  downloadAttendanceSummary,
  downloadTranscript,
  fetchCourseOfferings,
  fetchTerms,
  fetchCourses,
  fetchMyAtRiskStatus,
  fetchMyCourseRegistrations,
  registerForCourse,
} from '@/services/academicService'
import type { Enrollment } from '@/types/academic'

function formatPercent(value: number | null): string {
  return value === null ? 'No data yet' : `${Math.round(value * 100)}%`
}

export function CoursesPanel({ enrollments }: { enrollments: Enrollment[] }) {
  const queryClient = useQueryClient()
  const [registerError, setRegisterError] = useState<string | null>(null)

  const coursesQuery = useQuery({ queryKey: ['courses'], queryFn: fetchCourses })
  const offeringsQuery = useQuery({ queryKey: ['course-offerings'], queryFn: fetchCourseOfferings })
  const termsQuery = useQuery({ queryKey: ['terms'], queryFn: fetchTerms })
  const registrationsQuery = useQuery({
    queryKey: ['my-course-registrations'],
    queryFn: fetchMyCourseRegistrations,
  })
  const atRiskQuery = useQuery({ queryKey: ['my-at-risk'], queryFn: fetchMyAtRiskStatus })

  const registerMutation = useMutation({
    mutationFn: registerForCourse,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['my-course-registrations'] })
      await queryClient.invalidateQueries({ queryKey: ['my-at-risk'] })
    },
  })

  const isLoading =
    coursesQuery.isPending || offeringsQuery.isPending || registrationsQuery.isPending || atRiskQuery.isPending
  const isError = coursesQuery.isError || offeringsQuery.isError || registrationsQuery.isError || atRiskQuery.isError

  if (isLoading) {
    return (
      <div className="mt-4 flex flex-col gap-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mt-4">
        <ErrorState message="Could not load course information." />
      </div>
    )
  }

  const coursesById = new Map(coursesQuery.data.map((course) => [course.id, course]))
  const termsById = new Map((termsQuery.data ?? []).map((term) => [term.id, term]))
  const registeredOfferingIds = new Set(registrationsQuery.data.map((r) => r.courseOfferingId))
  const atRiskByOffering = new Map(atRiskQuery.data.map((status) => [status.courseOfferingId, status]))

  const availableByEnrollment = enrollments.map((enrollment) => ({
    enrollment,
    offerings: offeringsQuery.data.filter(
      (offering) =>
        offering.termId === enrollment.termId &&
        coursesById.get(offering.courseId)?.programId === enrollment.programId &&
        !registeredOfferingIds.has(offering.id),
    ),
  }))

  const hasAnyAvailable = availableByEnrollment.some(({ offerings }) => offerings.length > 0)

  const handleRegister = async (enrollmentId: string, courseOfferingId: string) => {
    setRegisterError(null)
    try {
      await registerMutation.mutateAsync({ enrollmentId, courseOfferingId })
    } catch (error) {
      setRegisterError(error instanceof Error ? error.message : 'Registration failed')
    }
  }

  return (
    <div className="mt-12">
      <h2 className="text-lg font-semibold tracking-tight text-text">Available courses</h2>
      <div className="mt-4">
        {hasAnyAvailable ? (
          <div className="flex flex-col gap-3">
            {availableByEnrollment.map(({ enrollment, offerings }) =>
              offerings.map((offering) => {
                const course = coursesById.get(offering.courseId)
                const termName = termsById.get(offering.termId)?.name
                return (
                  <div
                    key={offering.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-surface p-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-text">
                        {course?.name ?? offering.courseId} ({course?.code})
                      </p>
                      <p className="text-xs text-muted">
                        {termName ? `${termName} · ` : ''}Room {offering.room}
                        {course ? ` · ${course.credits} credits` : ''}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      isLoading={registerMutation.isPending}
                      onClick={() => handleRegister(enrollment.id, offering.id)}
                    >
                      Register
                    </Button>
                  </div>
                )
              }),
            )}
          </div>
        ) : (
          <EmptyState title="No courses available" message="There are no open courses for your enrolled term yet." />
        )}
        {registerError ? (
          <p role="alert" className="mt-2 text-sm text-error">
            {registerError}
          </p>
        ) : null}
      </div>

      <h2 className="mt-12 text-lg font-semibold tracking-tight text-text">My courses</h2>
      <div className="mt-4">
        {registrationsQuery.data.length === 0 ? (
          <EmptyState title="Not registered for any courses" message="Register for a course above to get started." />
        ) : (
          <div className="flex flex-col gap-3">
            {registrationsQuery.data.map((registration) => {
              const offering = offeringsQuery.data.find((o) => o.id === registration.courseOfferingId)
              const course = offering ? coursesById.get(offering.courseId) : undefined
              const risk = atRiskByOffering.get(registration.courseOfferingId)
              return (
                <div key={registration.id} className="rounded-lg border border-border bg-surface p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-text">
                      {course?.name ?? registration.courseOfferingId} ({course?.code})
                    </p>
                    {risk ? (
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                          risk.atRisk
                            ? 'border-error/30 bg-error/10 text-error'
                            : 'border-success/30 bg-success/10 text-success'
                        }`}
                      >
                        {risk.atRisk ? 'At risk' : 'On track'}
                      </span>
                    ) : null}
                  </div>
                  {risk ? (
                    <p className="mt-1 text-xs text-muted">
                      Attendance: {formatPercent(risk.attendanceRate)} · Assessment average:{' '}
                      {risk.assessmentAverage === null ? 'No data yet' : `${risk.assessmentAverage.toFixed(1)}%`}
                    </p>
                  ) : null}
                  <div className="mt-3">
                    <CourseGrades courseOfferingId={registration.courseOfferingId} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button variant="secondary" size="sm" onClick={() => downloadTranscript()}>
          Download transcript
        </Button>
        <Button variant="secondary" size="sm" onClick={() => downloadAttendanceSummary()}>
          Download attendance summary
        </Button>
      </div>
    </div>
  )
}
