'use client'

import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setTheme(
      document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    )
  }, [])

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.classList.toggle('dark', next === 'dark')
    try {
      localStorage.setItem('loonie-theme', next)
    } catch {
      // localStorage unavailable (private mode etc.) — theme still applies for this session
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className="btn-secondary"
    >
      {/* Suppress theme-dependent icon until mounted to avoid hydration mismatch */}
      <span aria-hidden className="text-base leading-none">
        {!mounted ? '◐' : theme === 'dark' ? '☀' : '☾'}
      </span>
      <span suppressHydrationWarning>
        {!mounted ? 'Theme' : theme === 'dark' ? 'Light mode' : 'Dark mode'}
      </span>
    </button>
  )
}
