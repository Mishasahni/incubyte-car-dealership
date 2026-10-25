import { useAuth } from '../auth/AuthContext'
import { Button, Wordmark } from './ui'

export function AppHeader() {
  const { user, isAdmin, signOut } = useAuth()

  return (
    <header className="border-b border-line bg-panel">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Wordmark />
        <div className="flex min-w-0 items-center gap-3 text-sm">
          <span className="hidden truncate text-silver sm:inline">{user?.email}</span>
          {isAdmin && (
            <span className="rounded-sm border border-accent/50 px-1.5 py-0.5 text-[11px] font-medium tracking-wider text-accent uppercase">
              Admin
            </span>
          )}
          <Button variant="ghost" className="px-2" onClick={signOut}>
            Log out
          </Button>
        </div>
      </div>
    </header>
  )
}
