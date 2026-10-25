import type { ReactNode } from 'react'

import { Alert, Button } from './ui'

/** Placeholder blocks while the inventory loads, announced once for screen readers. */
export function LoadingState({ blocks, className }: { blocks: number; className: string }) {
  return (
    <div aria-busy="true">
      <p className="sr-only">Loading inventory…</p>
      <div className={className}>
        {Array.from({ length: blocks }, (_, key) => (
          <div key={key} aria-hidden="true" className="animate-pulse rounded bg-surface/70" />
        ))}
      </div>
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <Alert>{message}</Alert>
      <Button variant="secondary" onClick={onRetry}>
        Retry
      </Button>
    </div>
  )
}

export function EmptyState({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded bg-surface px-6 py-16 text-center">
      <p className="text-sm text-muted">{children}</p>
      {action}
    </div>
  )
}
