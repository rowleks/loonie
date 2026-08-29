export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="page-title">Today&rsquo;s schedule</h1>
      <p className="mt-2 max-w-prose text-sm text-muted-foreground">
        The day view, unassigned-job alerts, cleaner assignment and metrics
        arrive with the operations phase.
      </p>

      <div className="card mt-6 p-6">
        <div className="label mb-2">Jobs today</div>
        <p className="text-sm text-muted-foreground">No bookings yet.</p>
      </div>
    </div>
  )
}
