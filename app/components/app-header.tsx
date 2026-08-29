import { signOutAction } from '@/app/actions/auth'

/**
 * Shared top bar for the three internal/role surfaces (customer, admin,
 * cleaner). Each surface passes its own label so the groups stay visually
 * distinct while sharing one implementation.
 */
export function AppHeader({
  surface,
  userName,
}: {
  surface: string
  userName: string
}) {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-lg font-bold tracking-tight">
            <span className="text-primary">Loonie</span> {surface}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {userName}
          </span>
          <form action={signOutAction}>
            <button type="submit" className="btn-ghost">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
