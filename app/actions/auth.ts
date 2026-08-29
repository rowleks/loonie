'use server'

import { AuthError } from 'next-auth'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema'
import { signIn, signOut } from '@/auth'
import { loginSchema, signupSchema } from '@/lib/validators'
import { dashboardPathForRole, getCurrentUser } from '@/lib/auth'
import { getPrimaryOrgId } from '@/lib/org'
import type { FormState } from '@/lib/form-state'

export async function signInAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Enter your email and password.' }

  try {
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    })
  } catch (error) {
    if (error instanceof AuthError) return { error: 'Invalid email or password.' }
    throw error
  }

  // Route each role to its own surface.
  const user = await getCurrentUser()
  redirect(user ? dashboardPathForRole(user.role) : '/dashboard')
}

export async function signUpAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Please check your details.' }
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1)
  if (existing) {
    return { error: 'An account with this email already exists. Try signing in.' }
  }

  const orgId = await getPrimaryOrgId()
  const passwordHash = await bcrypt.hash(parsed.data.password, 12)

  await db.insert(users).values({
    orgId,
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash,
    role: 'customer',
  })

  try {
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      // Account was created — send them to sign-in rather than surfacing a raw auth error.
      redirect('/signin')
    }
    throw error
  }

  redirect('/dashboard')
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: '/' })
}
