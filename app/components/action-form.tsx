'use client'

import { useActionState } from 'react'
import type { ReactNode } from 'react'
import { INITIAL_FORM_STATE, type FormState } from '@/lib/form-state'

type ActionFormProps = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>
  /** Hidden field values posted with the form. */
  hidden?: Record<string, string>
  children?: ReactNode
  label: string
  pendingLabel?: string
  className?: string
  /** Browser confirm() before submitting — for destructive actions. */
  confirmMessage?: string
}

/**
 * Small client wrapper for one-button server-action forms: renders hidden
 * fields, an optional select/children block, the submit button and inline
 * error/success text. Keeps the surfaces on the shared FormState convention.
 */
export function ActionForm({
  action,
  hidden = {},
  children,
  label,
  pendingLabel = 'Working…',
  className = 'btn-secondary',
  confirmMessage,
}: ActionFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_FORM_STATE)

  return (
    <form
      action={formAction}
      className="flex flex-col gap-1"
      onSubmit={
        confirmMessage
          ? (event) => {
              if (!window.confirm(confirmMessage)) event.preventDefault()
            }
          : undefined
      }
    >
      {children}
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button type="submit" disabled={pending} className={className}>
        {pending ? pendingLabel : label}
      </button>
      {state.error && (
        <p role="alert" className="text-destructive text-xs">
          {state.error}
        </p>
      )}
      {state.success && <p className="text-success text-xs">{state.success}</p>}
    </form>
  )
}
