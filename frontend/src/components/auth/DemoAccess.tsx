import { useEffect, useState } from 'react'

import { getDemoStatus, type DemoRole } from '../../api/auth'
import { ApiError } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { Modal } from '../Modal'
import { Alert } from '../ui'

const CHOICES: Record<DemoRole, { label: string; description: string }> = {
  buyer: {
    label: 'Explore as Buyer',
    description: 'Shop as a buyer: browse and search the inventory, see prices and stock, and purchase available vehicles.',
  },
  admin: {
    label: 'Explore as Admin',
    description: 'Run the showroom as an admin: add, edit, restock and delete vehicles.',
  },
}

/**
 * The sign-in page's demo entry. It appears only when the server reports demo access as on;
 * the server signs in its own dedicated demo accounts, so no credentials reach the browser.
 */
export function DemoAccess({ onSignedIn }: { onSignedIn: () => void }) {
  const { signInAsDemo } = useAuth()
  const [roles, setRoles] = useState<DemoRole[]>([])
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState<DemoRole | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    // Wrapped so that anything other than a status (an error, or no answer) just hides the entry.
    Promise.resolve()
      .then(getDemoStatus)
      .then((status) => {
        if (active && status?.enabled) setRoles(status.roles)
      })
      .catch(() => {
        // No demo status, no demo entry: the page stays a plain sign-in page.
      })
    return () => {
      active = false
    }
  }, [])

  if (roles.length === 0) return null

  async function explore(role: DemoRole) {
    setPending(role)
    setError(null)
    try {
      await signInAsDemo(role)
      onSignedIn()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not open the demo. Please try again.')
      setPending(null)
    }
  }

  return (
    <div className="mt-8 border-t border-hairline pt-6">
      <p className="text-sm text-muted">Evaluating Masar Auto?</p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 h-10 w-full rounded border border-line bg-white text-sm font-medium text-ink transition-colors hover:border-ink motion-reduce:transition-none"
      >
        Explore the demo
      </button>
      {open && (
        <Modal
          title="Explore the demo"
          description="Sign in to a dedicated demo account. Other visitors use the same accounts, so the demo data can change."
          onClose={() => setOpen(false)}
        >
          <div className="flex flex-col gap-3">
            {error && <Alert>{error}</Alert>}
            {roles.map((role) => (
              <div key={role} className="rounded border border-hairline p-4">
                <p className="text-sm text-muted">{CHOICES[role].description}</p>
                <button
                  type="button"
                  disabled={pending !== null}
                  onClick={() => explore(role)}
                  className="mt-3 h-10 w-full rounded bg-ink text-sm font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-muted motion-reduce:transition-none"
                >
                  {pending === role ? 'Opening…' : CHOICES[role].label}
                </button>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  )
}
