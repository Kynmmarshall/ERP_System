import { useAuth } from '@/features/auth/AuthContext'

export function OverviewPage() {
  const { principal } = useAuth()

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">Overview</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-text">
        Welcome, {principal?.fullName ?? 'there'}
      </h1>
      <p className="mt-2 text-sm text-muted">
        Signed in as <span className="text-text">{principal?.role}</span>
        {principal?.institutionId ? ' at ICT University' : ' (platform administrator)'}.
      </p>
    </div>
  )
}
