import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/features/auth/AuthContext'
import {
  createCourse,
  createCourseOffering,
  fetchCourseOfferings,
  fetchCourses,
  fetchPrograms,
  fetchTerms,
} from '@/services/academicService'

const selectClass =
  'mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text'

function NewCourseForm() {
  const queryClient = useQueryClient()
  const programsQuery = useQuery({ queryKey: ['programs'], queryFn: fetchPrograms })
  const [programId, setProgramId] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [credits, setCredits] = useState('3')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => createCourse({ programId, code, name, credits: Number(credits) }),
    onSuccess: async () => {
      setCode('')
      setName('')
      setError(null)
      await queryClient.invalidateQueries({ queryKey: ['courses'] })
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not create course'),
  })

  if (programsQuery.isPending) return <Skeleton className="h-24 w-full" />
  if (programsQuery.isError) return <ErrorState message="Could not load programmes." />

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        mutation.mutate()
      }}
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
    >
      <div>
        <label htmlFor="course-program" className="block text-sm font-medium text-text">
          Programme
        </label>
        <select
          id="course-program"
          value={programId}
          onChange={(event) => setProgramId(event.target.value)}
          className={selectClass}
          required
        >
          <option value="">Select…</option>
          {programsQuery.data.map((program) => (
            <option key={program.id} value={program.id}>
              {program.code} — {program.name}
            </option>
          ))}
        </select>
      </div>
      <FormField label="Code" htmlFor="course-code">
        <Input id="course-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="SEN101" required />
      </FormField>
      <FormField label="Title" htmlFor="course-name">
        <Input id="course-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </FormField>
      <FormField label="Credits" htmlFor="course-credits">
        <Input
          id="course-credits"
          type="number"
          min={1}
          value={credits}
          onChange={(e) => setCredits(e.target.value)}
          required
        />
      </FormField>
      <Button type="submit" size="sm" isLoading={mutation.isPending}>
        Add course
      </Button>
      {error ? (
        <p role="alert" className="text-xs text-error sm:col-span-2 lg:col-span-5">
          {error}
        </p>
      ) : null}
    </form>
  )
}

function NewOfferingForm() {
  const queryClient = useQueryClient()
  const { principal } = useAuth()
  const coursesQuery = useQuery({ queryKey: ['courses'], queryFn: fetchCourses })
  const termsQuery = useQuery({ queryKey: ['terms'], queryFn: fetchTerms })
  const [courseId, setCourseId] = useState('')
  const [termId, setTermId] = useState('')
  const [instructorId, setInstructorId] = useState('')
  const [room, setRoom] = useState('')
  const [capacity, setCapacity] = useState('50')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      createCourseOffering({
        courseId,
        termId,
        instructorId: instructorId || (principal?.id ?? ''),
        room,
        capacity: Number(capacity),
      }),
    onSuccess: async () => {
      setRoom('')
      setError(null)
      await queryClient.invalidateQueries({ queryKey: ['course-offerings'] })
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not create offering'),
  })

  if (coursesQuery.isPending || termsQuery.isPending) return <Skeleton className="h-24 w-full" />
  if (coursesQuery.isError || termsQuery.isError) return <ErrorState message="Could not load courses or terms." />

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        mutation.mutate()
      }}
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:items-end"
    >
      <div>
        <label htmlFor="offering-course" className="block text-sm font-medium text-text">
          Course
        </label>
        <select
          id="offering-course"
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className={selectClass}
          required
        >
          <option value="">Select…</option>
          {coursesQuery.data.map((course) => (
            <option key={course.id} value={course.id}>
              {course.code} — {course.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="offering-term" className="block text-sm font-medium text-text">
          Term
        </label>
        <select
          id="offering-term"
          value={termId}
          onChange={(e) => setTermId(e.target.value)}
          className={selectClass}
          required
        >
          <option value="">Select…</option>
          {termsQuery.data.map((term) => (
            <option key={term.id} value={term.id}>
              {term.name}
            </option>
          ))}
        </select>
      </div>
      <FormField label="Instructor id" htmlFor="offering-instructor">
        <Input
          id="offering-instructor"
          value={instructorId}
          onChange={(e) => setInstructorId(e.target.value)}
          placeholder={principal?.id ?? 'user id'}
        />
      </FormField>
      <FormField label="Room" htmlFor="offering-room">
        <Input id="offering-room" value={room} onChange={(e) => setRoom(e.target.value)} required />
      </FormField>
      <FormField label="Capacity" htmlFor="offering-capacity">
        <Input
          id="offering-capacity"
          type="number"
          min={1}
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          required
        />
      </FormField>
      <Button type="submit" size="sm" isLoading={mutation.isPending}>
        Add offering
      </Button>
      <p className="text-xs text-muted sm:col-span-2 lg:col-span-6">
        Leave the instructor blank to assign yourself. Only that instructor (or an admin) can grade
        or take attendance for the offering.
      </p>
      {error ? (
        <p role="alert" className="text-xs text-error sm:col-span-2 lg:col-span-6">
          {error}
        </p>
      ) : null}
    </form>
  )
}

export function CourseCatalogPanel() {
  const coursesQuery = useQuery({ queryKey: ['courses'], queryFn: fetchCourses })
  const offeringsQuery = useQuery({ queryKey: ['course-offerings'], queryFn: fetchCourseOfferings })

  return (
    <div>
      <section>
        <h2 className="text-sm font-medium text-text">Create a course</h2>
        <div className="mt-4">
          <NewCourseForm />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-text">Create a course offering</h2>
        <div className="mt-4">
          <NewOfferingForm />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-text">Catalogue</h2>
        {coursesQuery.isPending || offeringsQuery.isPending ? (
          <div className="mt-4">
            <Skeleton className="h-24 w-full" />
          </div>
        ) : coursesQuery.isError || offeringsQuery.isError ? (
          <div className="mt-4">
            <ErrorState message="Could not load the catalogue." />
          </div>
        ) : coursesQuery.data.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No courses yet" message="Add your first course above." />
          </div>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {coursesQuery.data.map((course) => {
              const offeringCount = offeringsQuery.data.filter((o) => o.courseId === course.id).length
              return (
                <li key={course.id} className="rounded-lg border border-border bg-surface p-4">
                  <p className="text-sm font-medium text-text">
                    {course.code} — {course.name}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {course.credits} credits · {offeringCount} offering{offeringCount === 1 ? '' : 's'}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
