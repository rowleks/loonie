'use client'

import { useActionState, useState } from 'react'
import { createBookingAction } from '@/app/actions/bookings'
import { INITIAL_FORM_STATE } from '@/lib/form-state'
import { formatMoney } from '@/lib/format'
import type { CleanerOption, CustomerOption, ServiceOption } from '@/lib/booking-queries'

const NEW_ADDRESS = '__new__'

/**
 * Phone-booking entry form. Address options follow the selected customer;
 * "New address" reveals inline address fields. Validation re-runs server-side
 * in createBookingAction — this is UX, not the security boundary.
 */
export function CreateBookingForm({
  customers,
  services,
  cleaners,
}: {
  customers: CustomerOption[]
  services: ServiceOption[]
  cleaners: CleanerOption[]
}) {
  const [state, formAction, pending] = useActionState(createBookingAction, INITIAL_FORM_STATE)
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? '')
  const [addressId, setAddressId] = useState('')

  const selectedCustomer = customers.find((customer) => customer.id === customerId)
  const addresses = selectedCustomer?.addresses ?? []
  const effectiveAddressId = addresses.some((address) => address.id === addressId)
    ? addressId
    : addresses[0]?.id ?? NEW_ADDRESS

  if (customers.length === 0 || services.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        You need at least one active customer and one active service before
        entering a booking.
      </p>
    )
  }

  return (
    <form action={formAction} className="card flex max-w-2xl flex-col gap-4 p-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="customerId" className="label">
            Customer
          </label>
          <select
            id="customerId"
            name="customerId"
            required
            className="input"
            value={customerId}
            onChange={(event) => {
              setCustomerId(event.target.value)
              setAddressId('')
            }}
          >
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="serviceId" className="label">
            Service
          </label>
          <select id="serviceId" name="serviceId" required className="input">
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} — {formatMoney(service.priceCents)} · {service.durationMinutes} min
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="addressId" className="label">
          Service address
        </label>
        <select
          id="addressId"
          name="addressId"
          className="input"
          value={effectiveAddressId}
          onChange={(event) => setAddressId(event.target.value)}
        >
          {addresses.map((address) => (
            <option key={address.id} value={address.id}>
              {[address.label, `${address.street}, ${address.city}`].filter(Boolean).join(' — ')}
            </option>
          ))}
          <option value={NEW_ADDRESS}>+ New address…</option>
        </select>
        {addresses.length === 0 && (
          <p className="text-xs text-muted-foreground">
            This customer has no saved addresses — add one below.
          </p>
        )}
      </div>

      {effectiveAddressId === NEW_ADDRESS && (
        <fieldset className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
          <legend className="label px-1">New address</legend>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="addressLabel" className="label">
              Label (optional)
            </label>
            <input id="addressLabel" name="addressLabel" className="input" placeholder="Home" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="addressStreet" className="label">
              Street address
            </label>
            <input id="addressStreet" name="addressStreet" required className="input" placeholder="123 W Broadway" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="addressUnit" className="label">
              Unit (optional)
            </label>
            <input id="addressUnit" name="addressUnit" className="input" placeholder="4B" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="addressCity" className="label">
              City
            </label>
            <input id="addressCity" name="addressCity" required className="input" placeholder="Vancouver" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="addressProvince" className="label">
              Province
            </label>
            <input id="addressProvince" name="addressProvince" defaultValue="BC" className="input" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="addressPostalCode" className="label">
              Postal code
            </label>
            <input id="addressPostalCode" name="addressPostalCode" required className="input" placeholder="V5Y 1P1" />
          </div>
        </fieldset>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="date" className="label">
            Date
          </label>
          <input id="date" name="date" type="date" required className="input" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="startTime" className="label">
            Start time
          </label>
          <input id="startTime" name="startTime" type="time" required className="input" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cleanerId" className="label">
            Cleaner (optional)
          </label>
          <select id="cleanerId" name="cleanerId" className="input" defaultValue="">
            <option value="">Decide later</option>
            {cleaners.map((cleaner) => (
              <option key={cleaner.id} value={cleaner.id}>
                {cleaner.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="label">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="input h-auto py-2"
          placeholder="Gate code, parking, areas to focus on…"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Phone bookings are taken as paid offline and confirmed immediately.
        Online bookings (Stripe) arrive with the customer booking flow.
      </p>

      {state.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary self-start">
        {pending ? 'Creating…' : 'Create booking'}
      </button>
    </form>
  )
}


