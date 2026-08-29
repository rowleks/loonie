export default function CleanerJobsPage() {
  return (
    <div>
      <h1 className="page-title">Today&rsquo;s jobs</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your route, tap-to-call and tap-to-map arrive with the cleaner phase.
      </p>

      <div className="card mt-6 p-6">
        <div className="label mb-2">Assigned jobs</div>
        <p className="text-sm text-muted-foreground">Nothing assigned yet.</p>
      </div>
    </div>
  )
}
