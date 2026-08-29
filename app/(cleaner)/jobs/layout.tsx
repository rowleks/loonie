import { AppHeader } from '@/app/components/app-header'
import { requireRole } from '@/lib/auth'

export default async function CleanerJobsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireRole('cleaner')

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader surface="Jobs" userName={user.name} />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  )
}
