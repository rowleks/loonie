import { AppHeader } from '@/app/components/app-header'
import { requireRole } from '@/lib/auth'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireRole('admin')

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader surface="Admin" userName={user.name} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  )
}
