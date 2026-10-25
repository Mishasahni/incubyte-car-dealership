import { useEffect, useId, useRef, useState } from 'react'

import { useAuth } from '../auth/AuthContext'

/** The signed-in account: a disclosure showing who is signed in, their role and Log out. */
export function AccountMenu() {
  const { user, isAdmin, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function close(event: MouseEvent | KeyboardEvent) {
      if (event instanceof KeyboardEvent ? event.key === 'Escape' : !rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  if (!user) return null
  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 items-center gap-2.5 rounded px-2 text-sm text-graphite hover:bg-hairline"
      >
        <span aria-hidden="true" className="grid size-7 place-items-center rounded-full bg-ink text-xs font-semibold text-white uppercase">
          {user.email.charAt(0)}
        </span>
        <span className="max-w-48 truncate max-sm:sr-only">{user.email}</span>
        <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 4.5 6 7.5 9 4.5" />
        </svg>
      </button>
      {open && (
        <div
          id={menuId}
          className="absolute top-12 right-0 z-40 w-64 rounded border border-hairline bg-surface p-4 shadow-lg shadow-black/5"
        >
          <p className="text-xs text-muted">Signed in as</p>
          <p className="mt-0.5 truncate text-sm font-medium">{user.email}</p>
          <p className="mt-1 text-xs text-muted">{isAdmin ? 'Admin account' : 'Buyer account'}</p>
          <button
            type="button"
            onClick={signOut}
            className="mt-4 h-9 w-full rounded border border-line text-sm font-medium hover:border-muted"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
