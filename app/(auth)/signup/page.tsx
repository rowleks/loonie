import type { Metadata } from 'next'
import Link from 'next/link'
import { SignUpForm } from '../_components/signup-form'

export const metadata: Metadata = {
  title: 'Create account — Loonie',
}

export default function SignUpPage() {
  return (
    <div>
      <h1 className="page-title">Create account</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Book your first clean in minutes.
      </p>

      <SignUpForm />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href="/signin"
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
