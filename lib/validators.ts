import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('Enter a valid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
})

export const signupSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(80, 'Name is too long'),
  email: z.email('Enter a valid email address').trim().toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
