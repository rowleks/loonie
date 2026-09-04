import { completeJobAction, startJobAction } from '@/app/actions/jobs'
import { ActionForm } from '@/app/components/action-form'
import { StatusBadge } from '@/app/components/status-badge'
import { formatTimeWindow } from '@/lib/datetime'
import { formatAddress, formatMoney, mapsDirectionsUrl } from '@/lib/format'
import type { BookingListItem } from '@/lib/booking-queries'

/**
 * One job in the cleaner's list — mobile-first: big time, tap-to-call the
 * customer, tap-to-map the address, then Start/Complete.
 */
export function JobCard({ job }: { job: BookingListItem }) {
  const canStart = job.status === 'confirmed'
  const canComplete = job.status === 'in_progress'

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-display text-lg font-bold tabular-nums">
            {formatTimeWindow(job.scheduledStart, job.scheduledEnd)}
          </div>
          <div className="mt-0.5 text-sm">
            {job.service.name} · {formatMoney(job.amountCents)}
          </div>
        </div>
        <StatusBadge status={job.status} />
      </div>

      <div className="mt-3 space-y-2 text-sm">
        <p className="font-medium">{job.customer.name}</p>
        {job.customer.phone && (
          <a
            href={`tel:${job.customer.phone.replace(/[^\d+]/g, '')}`}
            className="btn-secondary w-full"
          >
            📞 Call {job.customer.name.split(' ')[0]}
          </a>
        )}
        <a
          href={mapsDirectionsUrl(job.address)}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary w-full"
        >
          📍 Directions
        </a>
        <p className="text-muted-foreground">{formatAddress(job.address)}</p>
        {job.notes && <p className="italic text-muted-foreground">{job.notes}</p>}
      </div>

      {(canStart || canComplete) && (
        <div className="mt-4 flex gap-2 border-t pt-3">
          {canStart && (
            <ActionForm
              action={startJobAction}
              hidden={{ bookingId: job.id }}
              label="Start job"
              pendingLabel='Starting…'
              className="btn-primary flex-1"
            />
          )}
          {canComplete && (
            <ActionForm
              action={completeJobAction}
              hidden={{ bookingId: job.id }}
              label="Complete job"
              pendingLabel='Saving…'
              className="btn-primary flex-1"
            />
          )}
        </div>
      )}
    </div>
  )
}
