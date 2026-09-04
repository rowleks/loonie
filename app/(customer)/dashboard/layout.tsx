import type { ReactNode } from 'react'
import { AppHeader } from '@/app/components/app-header'
import { requireRole } from '@/lib/auth'

export default async function CustomerDashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const user = await requireRole('customer')

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader surface="Customer" userName={user.name} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  )
}
