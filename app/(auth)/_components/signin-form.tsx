'use client'

import { useActionState } from 'react'
import { signInAction } from '@/app/actions/auth'
import type { FormState } from '@/lib/form-state'

export function SignInForm() {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    signInAction,
    { error: null },
  )

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="input"
          placeholder="you@example.com"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="label">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
          placeholder="••••••••"
        />
      </div>

      {state.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
