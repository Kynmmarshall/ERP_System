import { CampaignsPanel } from '@/features/finance/staff/CampaignsPanel'

export function MarketingPage() {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">Marketing</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text">Marketing workspace</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Campaign spend, the leads each campaign brought in, and the return once those leads convert
        to paid tuition.
      </p>

      <div className="mt-8">
        <CampaignsPanel />
      </div>
    </div>
  )
}
