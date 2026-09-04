import type { ReactNode } from 'react'
import { AppHeader } from '@/app/components/app-header'
import { NavLinks } from '@/app/components/nav-links'
import { requireRole } from '@/lib/auth'

export default async function CleanerJobsLayout({
  children,
}: {
  children: ReactNode
}) {
  const user = await requireRole('cleaner')

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader surface="Jobs" userName={user.name} />
      <div className="border-b bg-card">
        <div className="mx-auto w-full max-w-lg px-4 py-2">
          <NavLinks
            links={[
              { href: '/jobs', label: 'Today' },
              { href: '/jobs/history', label: 'History' },
            ]}
          />
        </div>
      </div>
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  )
}

