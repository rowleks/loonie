import Link from 'next/link'
import { dashboardPathForRole, getCurrentUser } from '@/lib/auth'

export default async function Home() {
  const user = await getCurrentUser()

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        <h1 className="page-title">Loonie Cleaning Services</h1>
        <p className="mt-3 text-muted-foreground">
          Book and manage residential and commercial cleanings online. Serving
          Metro Vancouver.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {user ? (
            <Link
              href={dashboardPathForRole(user.role)}
              className="btn-primary"
            >
              Go to your dashboard
            </Link>
          ) : (
            <>
              <Link href="/signin" className="btn-primary">
                Sign in
              </Link>
              <Link href="/signup" className="btn-secondary">
                Create account
              </Link>
            </>
          )}
          <Link href="/style-guide" className="btn-ghost">
            Style guide
          </Link>
        </div>
      </div>
    </div>
  )
}

