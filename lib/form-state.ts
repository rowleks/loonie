/** Shared shape for `useActionState` form state (kept out of 'use server' files, which may only export async functions). */
export type FormState = { error: string | null }
