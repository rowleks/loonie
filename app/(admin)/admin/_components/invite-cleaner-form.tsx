'use client'

import { useActionState } from 'react'
import { inviteCleanerAction } from '@/app/actions/cleaners'
import { INITIAL_FORM_STATE } from '@/lib/form-state'

/** Admin "invite" — creates the cleaner account with an initial password. */
export function InviteCleanerForm() {
  const [state, formAction, pending] = useActionState(inviteCleanerAction, INITIAL_FORM_STATE)

  return (
    <form action={formAction} className="card flex max-w-2xl flex-col gap-4 p-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="label">
            Full name
          </label>
          <input id="name" name="name" required className="input" placeholder="Dana Okafor" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="label">
            Email
          </label>
          <input id="email" name="email" type="email" required className="input" placeholder="dana@loonie.example.com" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="phone" className="label">
            Phone (optional)
          </label>
          <input id="phone" name="phone" type="tel" className="input" placeholder="(604) 555-0111" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="label">
            Initial password
          </label>
          <input
            id="password"
            name="password"
            type="text"
            required
            minLength={8}
            className="input"
            placeholder="At least 8 characters"
            autoComplete="off"
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        The office shares the initial password with the cleaner directly for
        now — automated email invites arrive with notifications in Phase 2.
      </p>

      {state.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}
      {state.success && <p className="text-success text-sm">{state.success}</p>}

      <button type="submit" disabled={pending} className="btn-primary self-start">
        {pending ? 'Adding…' : 'Add cleaner'}
      </button>
    </form>
  )
}
