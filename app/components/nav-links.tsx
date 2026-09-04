'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Section nav for the internal surfaces. Client component so the active link
 * can be highlighted from the URL — the role check still happens server-side
 * in the layouts; this is navigation UX only.
 */
export function NavLinks({
  links,
}: {
  links: Array<{ href: string; label: string }>
}) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-wrap gap-1">
      {links.map((link) => {
        const active =
          pathname === link.href ||
          (link.href !== '/' && pathname.startsWith(`${link.href}/`))
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
              active
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
