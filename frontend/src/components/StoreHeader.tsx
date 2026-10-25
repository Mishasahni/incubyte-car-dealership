import { NavLink } from 'react-router'

import { AccountMenu } from './AccountMenu'
import { Wordmark } from './ui'

/** The buyer's compact header: branding, Inventory, and the account menu. */
export function StoreHeader() {
  return (
    <header className="border-b border-hairline bg-surface">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-10">
        <Wordmark />
        <nav aria-label="Main" className="max-sm:hidden">
          <NavLink to="/" end className="rounded px-3.5 py-2 text-sm font-medium aria-[current=page]:bg-hairline">
            Inventory
          </NavLink>
        </nav>
        <AccountMenu />
      </div>
    </header>
  )
}
