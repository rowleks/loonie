import { setBookingCleanerAction, setBookingStatusAction } from '@/app/actions/bookings'
import { ActionForm } from '@/app/components/action-form'
import { StatusBadge } from '@/app/components/status-badge'
import type { BookingStatus } from '@/db/schema'
import { formatDayRelative, formatTimeWindow } from '@/lib/datetime'
import { formatAddress, formatMoney, mapsDirectionsUrl } from '@/lib/format'
import type { BookingListItem, CleanerOption } from '@/lib/booking-queries'

/** Next status buttons the admin can press, per current status. */
const NEXT_ACTIONS: Record<
  string,
  Array<{ status: BookingStatus; label: string; className: string; confirm?: string }>
> = {
  pending: [{ status: 'confirmed', label: 'Confirm', className: 'btn-primary' }],
  confirmed: [{ status: 'in_progress', label: 'Start', className: 'btn-primary' }],
  in_progress: [
    { status: 'completed', label: 'Complete', className: 'btn-primary' },
    {
      status: 'cancelled',
      label: 'Cancel',
      className: 'btn-destructive',
      confirm:
        'Cancel this booking? Admin cancellation bypasses the 24-hour customer cutoff.',
    },
  ],
}

/**
 * One booking/job in an admin list: time, service, customer, address,
 * conflict-free cleaner assignment and status transitions. Server component —
 * interactivity lives in the ActionForm wrappers.
 */
export function BookingCard({
  booking,
  cleaners,
  showDay = false,
}: {
  booking: BookingListItem
  cleaners: CleanerOption[]
  showDay?: boolean
}) {
  const nextActions = NEXT_ACTIONS[booking.status] ?? []
  const modifiable =
    booking.status === 'pending' ||
    booking.status === 'confirmed' ||
    booking.status === 'in_progress'

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="font-semibold">
            {showDay && (
              <span className="text-muted-foreground">
                {formatDayRelative(booking.scheduledStart)} ·{' '}
              </span>
            )}
            {formatTimeWindow(booking.scheduledStart, booking.scheduledEnd)}
          </div>
          <div className="mt-0.5 text-sm">{booking.service.name}</div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={booking.status} />
          <span className="text-sm font-medium tabular-nums">
            {formatMoney(booking.amountCents)}
          </span>
        </div>
      </div>

      <div className="mt-3 space-y-1 text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">{booking.customer.name}</span>
          {booking.customer.phone && (
            <>
              {' · '}
              <a href={`tel:${booking.customer.phone.replace(/[^\d+]/g, '')}`} className="hover:text-foreground">
                {booking.customer.phone}
              </a>
            </>
          )}
        </p>
        <p>
          <a
            href={mapsDirectionsUrl(booking.address)}
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            {formatAddress(booking.address)}
          </a>
        </p>
        {booking.notes && <p className="italic">{booking.notes}</p>}
      </div>

      {modifiable && (
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t pt-3">
          <ActionForm
            action={setBookingCleanerAction}
            hidden={{ bookingId: booking.id }}
            label={booking.cleaner ? 'Reassign' : 'Assign'}
            pendingLabel='Saving…'
            className="btn-secondary"
          >
            <div className="flex flex-col gap-1">
              <label className="label" htmlFor={`cleaner-${booking.id}`}>
                Cleaner
              </label>
              <select
                id={`cleaner-${booking.id}`}
                name="cleanerId"
                defaultValue={booking.cleaner?.id ?? ''}
                className="input h-9 w-48"
              >
                <option value="">— Unassigned —</option>
                {cleaners.map((cleaner) => (
                  <option key={cleaner.id} value={cleaner.id}>
                    {cleaner.name}
                  </option>
                ))}
              </select>
            </div>
          </ActionForm>

          <div className="flex gap-2">
            {nextActions.map((next) => (
              <ActionForm
                key={next.status}
                action={setBookingStatusAction}
                hidden={{ bookingId: booking.id, status: next.status }}
                label={next.label}
                pendingLabel='…'
                className={next.className}
                confirmMessage={next.confirm}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
