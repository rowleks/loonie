import type { BookingStatus } from '@/db/schema'

const STATUS_STYLES: Record<BookingStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-warning/10 text-warning' },
  confirmed: { label: 'Confirmed', className: 'bg-primary/10 text-primary' },
  in_progress: { label: 'In progress', className: 'bg-accent/10 text-accent' },
  completed: { label: 'Completed', className: 'bg-success/10 text-success' },
  cancelled: { label: 'Cancelled', className: 'bg-destructive/10 text-destructive' },
}

export function StatusBadge({ status }: { status: BookingStatus }) {
  const style = STATUS_STYLES[status]
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${style.className}`}
    >
      {style.label}
    </span>
  )
}
