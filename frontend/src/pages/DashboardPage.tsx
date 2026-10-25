import { useAuth } from '../auth/AuthContext'
import { Button, Wordmark } from '../components/ui'

/** Inventory workspace. The vehicle list and tools arrive in M8 once the layout is approved. */
export function DashboardPage() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-panel">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Wordmark />
          <div className="flex items-center gap-3 text-sm text-silver">
            <span className="hidden sm:inline">
              {user?.email}
              {user?.role === 'admin' && ' · Admin'}
            </span>
            <Button variant="ghost" onClick={signOut}>
              Log out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
      </main>
    </div>
  )
}
