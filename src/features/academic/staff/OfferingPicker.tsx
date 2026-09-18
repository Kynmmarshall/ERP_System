import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useOfferingOptions } from '@/features/academic/staff/useOfferingOptions'

export function OfferingPicker({
  value,
  onChange,
  label = 'Course offering',
}: {
  value: string | null
  onChange: (offeringId: string | null) => void
  label?: string
}) {
  const { options, isPending, isError } = useOfferingOptions()

  if (isPending) return <Skeleton className="h-10 w-full max-w-md" />
  if (isError) return <ErrorState message="Could not load course offerings." />
  if (options.length === 0) {
    return (
      <EmptyState
        title="No course offerings assigned to you"
        message="You can only grade and take attendance for offerings where you are the instructor. Ask an administrator to assign you one, or create one under Courses."
      />
    )
  }

  return (
    <div className="max-w-md">
      <label htmlFor="offering-picker" className="block text-sm font-medium text-text">
        {label}
      </label>
      <select
        id="offering-picker"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value || null)}
        className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
      >
        <option value="">Select a course offering…</option>
        {options.map(({ offering, label: optionLabel }) => (
          <option key={offering.id} value={offering.id}>
            {optionLabel}
          </option>
        ))}
      </select>
    </div>
  )
}
