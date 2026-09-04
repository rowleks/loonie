import { CreateBookingForm } from '@/app/(admin)/admin/_components/create-booking-form'
import { requireRole } from '@/lib/auth'
import {
  getActiveCleaners,
  getActiveServices,
  getCustomersWithAddresses,
} from '@/lib/booking-queries'

export default async function NewBookingPage() {
  const admin = await requireRole('admin')

  const [customers, services, cleaners] = await Promise.all([
    getCustomersWithAddresses(admin.orgId),
    getActiveServices(admin.orgId),
    getActiveCleaners(admin.orgId),
  ])

  return (
    <div>
      <h1 className="page-title">New booking</h1>
      <p className="mt-2 max-w-prose text-sm text-muted-foreground">
        Entering a booking taken over the phone. The customer sees it on their
        dashboard and the assigned cleaner sees it on their jobs list.
      </p>

      <div className="mt-6">
        <CreateBookingForm
          customers={customers}
          services={services}
          cleaners={cleaners}
        />
      </div>
    </div>
  )
}
