import { requireUser } from '@/lib/auth'

export default async function CustomerDashboardPage() {
  // Layout already gates this route to customers — fetch user for the greeting.
  const user = await requireUser()

  return (
    <div>
      <h1 className="page-title">
        Welcome back, {user.name.split(' ')[0]}
      </h1>
      <p className="mt-2 max-w-prose text-sm text-muted-foreground">
        Your upcoming bookings, history and saved addresses will live here. The
        booking flow arrives with the next phase.
      </p>

      <div className="card mt-6 p-6">
        <div className="label mb-2">Upcoming bookings</div>
        <p className="text-sm text-muted-foreground">Nothing scheduled yet.</p>
      </div>
    </div>
  )
}
