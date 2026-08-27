import React from 'react'
import type { Metadata } from 'next'
import { Inter, Sora } from 'next/font/google'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

// Variable font (100–800) — full weight range available
const sora = Sora({
  variable: '--font-sora',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Loonie — Cleaning Services Platform',
  description:
    'Book and manage residential and commercial cleanings online. Loonie Cleaning Services, Metro Vancouver.',
}

// Applied before paint so the correct theme is present on first render
// (no flash). System preference by default, localStorage ("loonie-theme")
// override once the user toggles manually.
const themeScript = `
(function () {
  try {
    var theme = localStorage.getItem("loonie-theme");
    var dark = theme === "dark" || (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {}
})();
`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sora.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
