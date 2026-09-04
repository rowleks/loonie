'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { bookings } from '@/db/schema'
import { requireRole } from '@/lib/auth'
import { bookingIdSchema } from '@/lib/validators'
import type { FormState } from '@/lib/form-state'

/**
 * Cleaner-side job status transitions. Ownership is enforced in the query
 * itself: a cleaner can only ever touch bookings assigned to them, in their
 * own org — even if a modified client sent another booking's id.
 */
export async function startJobAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const cleaner = await requireRole('cleaner')

  const parsed = bookingIdSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Invalid request.' }

  const [booking] = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.id, parsed.data.bookingId),
        eq(bookings.cleanerId, cleaner.id),
        eq(bookings.orgId, cleaner.orgId),
      ),
    )
    .limit(1)
  if (!booking) return { error: 'Job not found.' }

  if (booking.status !== 'confirmed') {
    return {
      error:
        booking.status === 'in_progress'
          ? 'This job is already in progress.'
          : `This job can't be started from its current status.`,
    }
  }

  await db
    .update(bookings)
    .set({ status: 'in_progress', updatedAt: new Date() })
    .where(eq(bookings.id, booking.id))

  revalidatePath('/jobs')
  revalidatePath('/jobs/history')
  return { error: null, success: 'Job started.' }
}

export async function completeJobAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const cleaner = await requireRole('cleaner')

  const parsed = bookingIdSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Invalid request.' }

  const [booking] = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.id, parsed.data.bookingId),
        eq(bookings.cleanerId, cleaner.id),
        eq(bookings.orgId, cleaner.orgId),
      ),
    )
    .limit(1)
  if (!booking) return { error: 'Job not found.' }

  if (booking.status !== 'in_progress') {
    return { error: 'Only started jobs can be completed.' }
  }

  await db
    .update(bookings)
    .set({ status: 'completed', updatedAt: new Date() })
    .where(eq(bookings.id, booking.id))

  revalidatePath('/jobs')
  revalidatePath('/jobs/history')
  return { error: null, success: 'Job completed.' }
}
