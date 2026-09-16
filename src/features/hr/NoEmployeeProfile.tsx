import { EmptyState } from '@/components/ui/EmptyState'

export function NoEmployeeProfile({ what }: { what: string }) {
  return (
    <EmptyState
      title="No employee profile yet"
      message={`Your account is not linked to an employee record, so there are no ${what} to show. An administrator links accounts to employees under People & Operations.`}
    />
  )
}
