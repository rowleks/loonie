/** Shared shape for `useActionState` form state (kept out of 'use server' files, which may only export async functions). */
export type FormState = { error: string | null; success?: string }

export const INITIAL_FORM_STATE: FormState = { error: null }

