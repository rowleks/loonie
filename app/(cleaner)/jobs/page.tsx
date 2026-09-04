import { JobCard } from '@/app/(cleaner)/jobs/_components/job-card'
import { requireRole } from '@/lib/auth'
import { getCleanerDayBookings } from '@/lib/booking-queries'
import { formatDay, getTodayRange } from '@/lib/datetime'

export default async function CleanerJobsPage() {
  // Layout already gates this route to cleaners.
  const cleaner = await requireRole('cleaner')
  const now = new Date()
  const today = getTodayRange(now)

  const jobs = await getCleanerDayBookings(
    cleaner.id,
    cleaner.orgId,
    today.start,
    today.end,
  )

  const upcomingJobs = jobs.filter(
    (job) => job.status === 'confirmed' || job.status === 'in_progress',
  )
  const finishedJobs = jobs.filter(
    (job) => job.status === 'completed' || job.status === 'cancelled',
  )

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="page-title">Today&rsquo;s jobs</h1>
        <p className="text-sm text-muted-foreground">{formatDay(now)}</p>
      </div>

      {upcomingJobs.length === 0 ? (
        <div className="card mt-6 p-6">
          <p className="text-sm text-muted-foreground">
            {jobs.length === 0
              ? 'Nothing assigned to you today. Check back in the morning.'
              : 'All done for today — nice work.'}
          </p>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {upcomingJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      {finishedJobs.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-lg font-bold">Finished today</h2>
          <div className="mt-4 flex flex-col gap-3 opacity-75">
            {finishedJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

