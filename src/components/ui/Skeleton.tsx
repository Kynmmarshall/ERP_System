export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-surface-elevated ${className}`} aria-hidden="true" />
}
