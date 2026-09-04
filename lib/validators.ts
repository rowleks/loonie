import { z } from 'zod'

/** Optional phone: empty string / missing → undefined; otherwise loose format check. */
const optionalPhone = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z
    .string()
    .trim()
    .regex(/^[\d\s()+\-.]{7,20}$/, 'Enter a valid phone number')
    .optional(),
)

export const loginSchema = z.object({
  email: z.email('Enter a valid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
})

export const signupSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(80, 'Name is too long'),
  email: z.email('Enter a valid email address').trim().toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: optionalPhone,
})

export const inviteCleanerSchema = z.object({
  name: z.string().trim().min(2, 'Enter the cleaner’s name').max(80, 'Name is too long'),
  email: z.email('Enter a valid email address').trim().toLowerCase(),
  phone: optionalPhone,
  /** Initial password the office shares manually — proper invites arrive with Resend (Phase 2). */
  password: z.string().min(8, 'Initial password must be at least 8 characters'),
})

export const setCleanerActiveSchema = z.object({
  userId: z.uuid('Invalid cleaner'),
  active: z.enum(['0', '1']),
})

export const bookingIdSchema = z.object({
  bookingId: z.uuid('Invalid booking'),
})

export const setBookingCleanerSchema = z.object({
  bookingId: z.uuid('Invalid booking'),
  /** Empty string = unassign. */
  cleanerId: z.union([z.literal(''), z.uuid('Invalid cleaner')]),
})

export const setBookingStatusSchema = z.object({
  bookingId: z.uuid('Invalid booking'),
  status: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']),
})

export const createBookingSchema = z.object({
  customerId: z.uuid('Select a customer'),
  serviceId: z.uuid('Select a service'),
  /** Empty string = create a new address from the inline fields. */
  addressId: z.union([z.literal(''), z.uuid('Select an address')]),
  cleanerId: z.union([z.literal(''), z.uuid('Invalid cleaner')]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date'),
  startTime: z.string().regex(/^\d{1,2}:\d{2}$/, 'Choose a start time'),
  notes: z
    .union([z.literal(''), z.string().trim().max(500, 'Notes are too long')])
    .optional(),
})

export const addressSchema = z.object({
  label: z
    .union([z.literal(''), z.string().trim().max(60, 'Label is too long')])
    .optional()
    .transform((value) => (value ? value : null)),
  street: z.string().trim().min(3, 'Enter the street address').max(200, 'Street is too long'),
  unit: z
    .union([z.literal(''), z.string().trim().max(20, 'Unit is too long')])
    .optional()
    .transform((value) => (value ? value : null)),
  city: z.string().trim().min(2, 'Enter the city').max(80, 'City is too long'),
  province: z.string().trim().min(2, 'Enter the province').max(80, 'Province is too long'),
  postalCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, 'Enter a valid Canadian postal code'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type AddressInput = z.infer<typeof addressSchema>

