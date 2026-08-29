import type { Metadata } from 'next'
import Link from 'next/link'
import { SignInForm } from '../_components/signin-form'

export const metadata: Metadata = {
  title: 'Sign in — Loonie',
}

export default function SignInPage() {
  return (
    <div>
      <h1 className="page-title">Sign in</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">Welcome back.</p>

      <SignInForm />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to Loonie?{' '}
        <Link
          href="/signup"
          className="font-medium text-primary hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  )
}
