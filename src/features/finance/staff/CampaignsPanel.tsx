import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatXaf } from '@/lib/currency'
import {
  createCampaign,
  createLead,
  fetchCampaignLeads,
  fetchCampaignRoi,
  fetchCampaigns,
} from '@/services/financeService'

function RoiBadge({ campaignId }: { campaignId: string }) {
  const roiQuery = useQuery({
    queryKey: ['campaign-roi', campaignId],
    queryFn: () => fetchCampaignRoi(campaignId),
  })

  if (roiQuery.isPending) return <Skeleton className="h-5 w-24" />
  if (roiQuery.isError) return <span className="text-xs text-error">ROI unavailable</span>

  const { roi, roiUnavailableReason, attributedRevenueXaf } = roiQuery.data

  // A null ROI is a real, meaningful state (e.g. zero spend) - showing 0%
  // would be fabricating a number the backend deliberately refused to give.
  if (roi === null) {
    return (
      <span className="text-xs text-muted" title={roiUnavailableReason ?? undefined}>
        ROI unavailable{roiUnavailableReason ? ` — ${roiUnavailableReason}` : ''}
      </span>
    )
  }

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        roi >= 0 ? 'bg-success/15 text-success' : 'bg-error/15 text-error'
      }`}
    >
      ROI {(roi * 100).toFixed(1)}% · {formatXaf(attributedRevenueXaf)} attributed
    </span>
  )
}

function LeadsList({ campaignId }: { campaignId: string }) {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const leadsQuery = useQuery({
    queryKey: ['campaign-leads', campaignId],
    queryFn: () => fetchCampaignLeads(campaignId),
  })

  const addLead = useMutation({
    mutationFn: () => createLead(campaignId),
    onSuccess: async () => {
      setError(null)
      await queryClient.invalidateQueries({ queryKey: ['campaign-leads', campaignId] })
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not add lead'),
  })

  if (leadsQuery.isPending) return <Skeleton className="mt-3 h-16 w-full" />
  if (leadsQuery.isError) return <ErrorState message="Could not load leads." />

  const converted = leadsQuery.data.filter((lead) => lead.status === 'CONVERTED').length

  return (
    <div className="mt-3 border-t border-border/60 pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted">
          {leadsQuery.data.length} lead{leadsQuery.data.length === 1 ? '' : 's'} · {converted} converted
        </p>
        <Button size="sm" variant="secondary" isLoading={addLead.isPending} onClick={() => addLead.mutate()}>
          Add lead
        </Button>
      </div>

      {leadsQuery.data.length > 0 ? (
        <ul className="mt-2 flex flex-col gap-1">
          {leadsQuery.data.map((lead) => (
            <li key={lead.id} className="flex items-center justify-between text-xs text-muted">
              <span>Lead {lead.id.slice(0, 8)}</span>
              <span className="uppercase tracking-wide">{lead.status}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? (
        <p role="alert" className="mt-2 text-xs text-error">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function CampaignsPanel() {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [costXaf, setCostXaf] = useState('')
  const [startsOn, setStartsOn] = useState('')
  const [endsOn, setEndsOn] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [openCampaignId, setOpenCampaignId] = useState<string | null>(null)

  const campaignsQuery = useQuery({ queryKey: ['campaigns'], queryFn: fetchCampaigns })

  const mutation = useMutation({
    mutationFn: () => createCampaign({ name, costXaf: Number(costXaf || 0), startsOn, endsOn }),
    onSuccess: async () => {
      setName('')
      setCostXaf('')
      setError(null)
      await queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not create campaign'),
  })

  return (
    <div>
      <section>
        <h2 className="text-sm font-medium text-text">Create a campaign</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            mutation.mutate()
          }}
          className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
        >
          <FormField label="Name" htmlFor="campaign-name">
            <Input id="campaign-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </FormField>
          <FormField label="Cost (XAF)" htmlFor="campaign-cost">
            <Input
              id="campaign-cost"
              type="number"
              min={0}
              value={costXaf}
              onChange={(e) => setCostXaf(e.target.value)}
              placeholder="0"
            />
          </FormField>
          <FormField label="Starts" htmlFor="campaign-starts">
            <Input
              id="campaign-starts"
              type="date"
              value={startsOn}
              onChange={(e) => setStartsOn(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Ends" htmlFor="campaign-ends">
            <Input
              id="campaign-ends"
              type="date"
              value={endsOn}
              onChange={(e) => setEndsOn(e.target.value)}
              required
            />
          </FormField>
          <Button type="submit" size="sm" isLoading={mutation.isPending}>
            Create campaign
          </Button>
          {error ? (
            <p role="alert" className="text-xs text-error sm:col-span-2 lg:col-span-5">
              {error}
            </p>
          ) : null}
        </form>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-text">Campaigns</h2>
        {campaignsQuery.isPending ? (
          <div className="mt-4">
            <Skeleton className="h-24 w-full" />
          </div>
        ) : campaignsQuery.isError ? (
          <div className="mt-4">
            <ErrorState message="Could not load campaigns." />
          </div>
        ) : campaignsQuery.data.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No campaigns yet" message="Create one above to start tracking leads and ROI." />
          </div>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {campaignsQuery.data.map((campaign) => {
              const isOpen = openCampaignId === campaign.id
              return (
                <li key={campaign.id} className="rounded-lg border border-border bg-surface p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-text">{campaign.name}</p>
                      <p className="mt-1 text-xs text-muted">
                        {campaign.startsOn} → {campaign.endsOn} · spend {formatXaf(campaign.costXaf)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <RoiBadge campaignId={campaign.id} />
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setOpenCampaignId(isOpen ? null : campaign.id)}
                      >
                        {isOpen ? 'Hide leads' : 'Leads'}
                      </Button>
                    </div>
                  </div>
                  {isOpen ? <LeadsList campaignId={campaign.id} /> : null}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
