import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/features/auth/AuthContext'
import { ROLE_LABELS, ROLES } from '@/features/auth/roles'
import { RoleRequestsPanel } from '@/features/admin/RoleRequestsPanel'
import { fetchUsers, updateUserRole } from '@/services/usersService'
import type { Role } from '@/types/auth'

function RoleSelect({
  user,
  onChange,
  disabled,
  disabledReason,
}: {
  user: { id: string; role: Role }
  onChange: (role: Role) => void
  disabled: boolean
  disabledReason?: string
}) {
  const selectId = `role-${user.id}`
  return (
    <>
      <label className="sr-only" htmlFor={selectId}>
        Role
      </label>
      <select
        id={selectId}
        value={user.role}
        disabled={disabled}
        title={disabled ? disabledReason : undefined}
        onChange={(event) => onChange(event.target.value as Role)}
        className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-text disabled:cursor-not-allowed disabled:opacity-50"
      >
        {ROLES.map((role) => (
          <option key={role} value={role}>
            {ROLE_LABELS[role]}
          </option>
        ))}
      </select>
    </>
  )
}

export function UsersPage() {
  const { principal } = useAuth()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const usersQuery = useQuery({ queryKey: ['users'], queryFn: fetchUsers })

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Role }) => updateUserRole(userId, role),
    onSuccess: async () => {
      setError(null)
      await queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not change role'),
  })

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">Settings</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-text">User access</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Roles decide what each person can reach. Self-registration always creates a Student account,
        so Staff and Admin access is granted here - either directly in the table below, or by
        approving an access request. You cannot change your own role, and only a Super Admin can
        grant or remove Super Admin.
      </p>

      {error ? (
        <div className="mt-4">
          <ErrorState message={error} />
        </div>
      ) : null}

      {usersQuery.isPending ? (
        <div className="mt-6 flex flex-col gap-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : usersQuery.isError ? (
        <div className="mt-6">
          <ErrorState message="Could not load users." />
        </div>
      ) : usersQuery.data.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No users found" />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <caption className="sr-only">Users in your institution and their roles</caption>
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th scope="col" className="py-2 pr-4 font-medium">
                  Name
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">
                  Email
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">
                  Status
                </th>
                <th scope="col" className="py-2 font-medium">
                  Role
                </th>
              </tr>
            </thead>
            <tbody>
              {usersQuery.data.map((user) => {
                const isSelf = user.id === principal?.id
                const isProtectedSuperAdmin =
                  user.role === 'super_admin' && principal?.role !== 'super_admin'
                const disabled = isSelf || isProtectedSuperAdmin || roleMutation.isPending
                return (
                  <tr key={user.id} className="border-b border-border/60">
                    <td className="py-3 pr-4 text-text">
                      {user.fullName}
                      {isSelf ? <span className="ml-2 text-xs text-muted">(you)</span> : null}
                    </td>
                    <td className="py-3 pr-4 text-muted">{user.email}</td>
                    <td className="py-3 pr-4 text-muted">{user.isActive ? 'Active' : 'Disabled'}</td>
                    <td className="py-3">
                      <RoleSelect
                        user={user}
                        disabled={disabled}
                        disabledReason={
                          isSelf
                            ? 'You cannot change your own role'
                            : isProtectedSuperAdmin
                              ? 'Only a Super Admin can change a Super Admin'
                              : undefined
                        }
                        onChange={(role) => roleMutation.mutate({ userId: user.id, role })}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <RoleRequestsPanel />
    </div>
  )
}
