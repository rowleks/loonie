import { JobCard } from '@/app/(cleaner)/jobs/_components/job-card'
import { requireRole } from '@/lib/auth'
import { getCleanerBookingHistory } from '@/lib/booking-queries'

export default async function CleanerHistoryPage() {
  const cleaner = await requireRole('cleaner')

  const jobs = await getCleanerBookingHistory(cleaner.id, cleaner.orgId, new Date())

  return (
    <div>
      <h1 className="page-title">Job history</h1>

      {jobs.length === 0 ? (
        <div className="card mt-6 p-6">
          <p className="text-sm text-muted-foreground">
            No completed jobs yet — your history builds up as you finish jobs.
          </p>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3 opacity-90">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  )
}
