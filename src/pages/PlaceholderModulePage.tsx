import { EmptyState } from '@/components/ui/EmptyState'

export function PlaceholderModulePage({ title }: { title: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">{title}</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text">{title}</h1>
      <div className="mt-8">
        <EmptyState
          title="Not built yet"
          message="This module lands in a later development phase of this project."
        />
      </div>
    </div>
  )
}
