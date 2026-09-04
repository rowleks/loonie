import type { ReactNode } from 'react'
import { AppHeader } from '@/app/components/app-header'
import { NavLinks } from '@/app/components/nav-links'
import { requireRole } from '@/lib/auth'

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const user = await requireRole('admin')

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader surface="Admin" userName={user.name} />
      <div className="border-b bg-card">
        <div className="mx-auto w-full max-w-6xl px-6 py-2">
          <NavLinks
            links={[
              { href: '/admin', label: 'Today' },
              { href: '/admin/bookings', label: 'Bookings' },
              { href: '/admin/bookings/new', label: 'New booking' },
              { href: '/admin/cleaners', label: 'Cleaners' },
            ]}
          />
        </div>
      </div>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  )
}

