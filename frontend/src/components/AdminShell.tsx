import type { ReactNode } from 'react'

import { useAuth } from '../auth/AuthContext'
import { Wordmark } from './ui'

export type AdminView = 'inventory' | 'attention'

interface AdminShellProps {
  view: AdminView
  counts: Record<AdminView, number>
  onViewChange: (view: AdminView) => void
  children: ReactNode
}

const VIEWS: { id: AdminView; label: string }[] = [
  { id: 'inventory', label: 'Inventory' },
  { id: 'attention', label: 'Stock attention' },
]

/** The near-black admin console: a sidebar on large screens, a top bar with tabs below that. */
export function AdminShell({ view, counts, onViewChange, children }: AdminShellProps) {
  const { user, signOut } = useAuth()
  return (
    <div className="min-h-screen lg:flex">
      <aside className="flex flex-col bg-console text-white lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:shrink-0 lg:px-3.5 lg:py-5">
        <div className="flex h-14 items-center justify-between gap-3 px-4 lg:h-auto lg:px-2.5 lg:pb-6">
          <div className="flex items-center gap-2.5">
            <Wordmark className="text-white" />
            <span className="rounded-sm bg-white px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.12em] text-ink uppercase">
              Admin
            </span>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="h-8 rounded border border-white/20 px-3 text-[13px] font-medium hover:border-white/50 lg:hidden"
          >
            Log out
          </button>
        </div>
        <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:gap-0.5 lg:px-0 lg:pb-0">
          {VIEWS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-current={view === id ? 'page' : undefined}
              onClick={() => onViewChange(id)}
              className="flex h-10 shrink-0 items-center justify-between gap-4 rounded px-3 text-sm font-medium text-console-text hover:text-white aria-[current=page]:bg-console-raised aria-[current=page]:text-white"
            >
              {label}
              <span className="text-xs tabular-nums text-console-text">{counts[id]}</span>
            </button>
          ))}
        </nav>
        <div className="mt-auto hidden flex-col gap-2.5 border-t border-white/10 px-2.5 pt-4 lg:flex">
          <span className="truncate text-[13px] text-console-text">{user?.email}</span>
          <button
            type="button"
            onClick={signOut}
            className="h-8 self-start rounded border border-white/20 px-3 text-[13px] font-medium hover:border-white/50"
          >
            Log out
          </button>
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
