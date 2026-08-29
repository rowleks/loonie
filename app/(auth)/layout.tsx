import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Link href="/" className="font-display text-2xl font-bold tracking-tight">
            <span className="text-primary">Loonie</span>
          </Link>
        </div>
        <div className="card p-6">{children}</div>
      </div>
    </div>
  )
}
