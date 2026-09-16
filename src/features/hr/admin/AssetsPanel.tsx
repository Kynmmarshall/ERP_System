import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { useEmployeeNames, useEmployees } from '@/features/hr/admin/useEmployeeNames'
import {
  createAsset,
  createAssetMovement,
  fetchAssetMovements,
  fetchAssets,
} from '@/services/hrService'
import type { Asset } from '@/types/hr'

/** The API takes a signed quantity_delta plus an optional employee_id; these
 *  four actions are the only meaningful combinations, so the form offers them
 *  directly instead of asking an admin to get a sign right. */
const ACTIONS = [
  { id: 'assign', label: 'Assign to employee', needsEmployee: true, sign: 1 },
  { id: 'return', label: 'Return from employee', needsEmployee: true, sign: -1 },
  { id: 'add', label: 'Add to stock', needsEmployee: false, sign: 1 },
  { id: 'writeoff', label: 'Write off stock', needsEmployee: false, sign: -1 },
] as const

type ActionId = (typeof ACTIONS)[number]['id']

function NewAssetForm() {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [quantity, setQuantity] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => createAsset({ name, category, totalQuantity: Number(quantity) }),
    onSuccess: async () => {
      setName('')
      setCategory('')
      setQuantity('')
      setError(null)
      await queryClient.invalidateQueries({ queryKey: ['hr', 'assets'] })
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not create asset'),
  })

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        mutation.mutate()
      }}
      className="mt-4 grid gap-3 sm:grid-cols-4 sm:items-end"
    >
      <FormField label="Name" htmlFor="asset-name">
        <Input
          id="asset-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Dell Latitude 5440"
          required
        />
      </FormField>
      <FormField label="Category" htmlFor="asset-category">
        <Input
          id="asset-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Laptop"
          required
        />
      </FormField>
      <FormField label="Total quantity" htmlFor="asset-quantity">
        <Input
          id="asset-quantity"
          type="number"
          min={0}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />
      </FormField>
      <Button type="submit" size="sm" isLoading={mutation.isPending}>
        Add asset
      </Button>
      {error ? (
        <p role="alert" className="text-xs text-error sm:col-span-4">
          {error}
        </p>
      ) : null}
    </form>
  )
}

function AssetDetail({ asset }: { asset: Asset }) {
  const queryClient = useQueryClient()
  const employeesQuery = useEmployees()
  const employeeName = useEmployeeNames()
  const [action, setAction] = useState<ActionId>('assign')
  const [employeeId, setEmployeeId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const movementsQuery = useQuery({
    queryKey: ['hr', 'asset-movements', asset.id],
    queryFn: () => fetchAssetMovements(asset.id),
  })

  const selected = ACTIONS.find((candidate) => candidate.id === action) ?? ACTIONS[0]

  const mutation = useMutation({
    mutationFn: () =>
      createAssetMovement({
        assetId: asset.id,
        employeeId: selected.needsEmployee ? employeeId : null,
        quantityDelta: selected.sign * Number(quantity),
        reason,
      }),
    onSuccess: async () => {
      setReason('')
      setError(null)
      await queryClient.invalidateQueries({ queryKey: ['hr', 'asset-movements', asset.id] })
      await queryClient.invalidateQueries({ queryKey: ['hr', 'assets'] })
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not record movement'),
  })

  const movements = movementsQuery.data ?? []
  const assignedOut = movements
    .filter((movement) => movement.employeeId !== null)
    .reduce((sum, movement) => sum + movement.quantityDelta, 0)

  return (
    <div className="mt-3 border-t border-border pt-3">
      <p className="text-sm text-muted">
        <span className="tabular-nums text-text">{asset.totalQuantity - assignedOut}</span> on hand ·{' '}
        <span className="tabular-nums text-text">{assignedOut}</span> assigned out
      </p>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          mutation.mutate()
        }}
        className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
      >
        <FormField label="Action" htmlFor={`movement-action-${asset.id}`}>
          <select
            id={`movement-action-${asset.id}`}
            value={action}
            onChange={(e) => setAction(e.target.value as ActionId)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
          >
            {ACTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>
        {selected.needsEmployee ? (
          <FormField label="Employee" htmlFor={`movement-employee-${asset.id}`}>
            <select
              id={`movement-employee-${asset.id}`}
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
            >
              <option value="">Select…</option>
              {(employeesQuery.data ?? []).map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.fullName}
                </option>
              ))}
            </select>
          </FormField>
        ) : null}
        <FormField label="Quantity" htmlFor={`movement-quantity-${asset.id}`}>
          <Input
            id={`movement-quantity-${asset.id}`}
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </FormField>
        <FormField label="Reason" htmlFor={`movement-reason-${asset.id}`}>
          <Input
            id={`movement-reason-${asset.id}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
        </FormField>
        <Button type="submit" size="sm" isLoading={mutation.isPending}>
          Record movement
        </Button>
        {error ? (
          <p role="alert" className="text-xs text-error sm:col-span-2 lg:col-span-5">
            {error}
          </p>
        ) : null}
      </form>

      {movementsQuery.isPending ? (
        <div className="mt-4">
          <Skeleton className="h-16 w-full" />
        </div>
      ) : movementsQuery.isError ? (
        <div className="mt-4">
          <ErrorState message="Could not load movements." />
        </div>
      ) : movements.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No movements recorded for this asset.</p>
      ) : (
        <ul className="mt-4 space-y-1.5">
          {movements.map((movement) => (
            <li key={movement.id} className="flex flex-wrap justify-between gap-2 text-sm">
              <span className="text-muted">
                {movement.employeeId ? employeeName(movement.employeeId) : 'General stock'} ·{' '}
                {movement.reason}
              </span>
              <span className="tabular-nums text-text">
                {movement.quantityDelta > 0 ? '+' : ''}
                {movement.quantityDelta}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function AssetsPanel() {
  const [expanded, setExpanded] = useState<string | null>(null)
  const assetsQuery = useQuery({ queryKey: ['hr', 'assets'], queryFn: fetchAssets })

  return (
    <div>
      <section>
        <h2 className="text-sm font-medium text-text">Register an asset</h2>
        <NewAssetForm />
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-text">Inventory</h2>
        {assetsQuery.isPending ? (
          <div className="mt-4">
            <Skeleton className="h-24 w-full" />
          </div>
        ) : assetsQuery.isError ? (
          <div className="mt-4">
            <ErrorState message="Could not load assets." />
          </div>
        ) : assetsQuery.data.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No assets registered" message="Add the first one above." />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {assetsQuery.data.map((asset) => (
              <li key={asset.id} className="rounded-lg border border-border bg-surface-elevated p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text">{asset.name}</p>
                    <p className="mt-0.5 text-sm text-muted">
                      {asset.category} · {asset.totalQuantity} total
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setExpanded(expanded === asset.id ? null : asset.id)}
                  >
                    {expanded === asset.id ? 'Hide movements' : 'Movements'}
                  </Button>
                </div>
                {expanded === asset.id ? <AssetDetail asset={asset} /> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
