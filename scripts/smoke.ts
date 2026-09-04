/* eslint-disable no-console */
/**
 * Authenticated smoke test against a running server (default :3100).
 * Usage: npx tsx scripts/smoke.ts
 * Prints per-role page probes; never prints secrets.
 */
import './env'

const BASE = process.env.SMOKE_BASE ?? 'http://localhost:3100'

type Session = { cookies: Map<string, string> }

const jar = new Map<string, string>()

function cookieHeader(): string {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
}

async function req(path: string, init: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    redirect: 'manual',
    ...init,
    headers: { cookie: cookieHeader(), ...(init.headers ?? {}) },
  })
  for (const raw of res.headers.getSetCookie?.() ?? []) {
    const [pair] = raw.split(';')
    const idx = pair.indexOf('=')
    const name = pair.slice(0, idx).trim()
    const value = pair.slice(idx + 1).trim()
    if (value === '' && name.includes('session-token')) {
      jar.delete(name)
    } else if (name === 'authjs.session-token' || name === 'authjs.csrf-token' || name === 'authjs.callback-url') {
      jar.set(name, value)
    }
  }
  return res
}

async function login(email: string, password: string): Promise<boolean> {
  jar.clear()
  const csrfRes = await req('/api/auth/csrf')
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string }
  const res = await req('/api/auth/callback/credentials', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ csrfToken, email, password, callbackUrl: `${BASE}/` }),
  })
  return res.status === 302 && (jar.get('authjs.session-token') ?? '').length > 0
}

async function probe(path: string): Promise<string> {
  const res = await req(path)
  const loc = res.headers.get('location')
  return `${path} -> ${res.status}${loc ? ` -> ${loc.replace(BASE, '')}` : ''}`
}

/** 200 + must contain `needle` in the rendered HTML. */
async function contentProbe(path: string, needle: string): Promise<string> {
  const res = await req(path)
  const text = await res.text()
  const ok = res.status === 200 && text.includes(needle)
  return `${path} contains "${needle}": ${ok ? 'YES' : 'NO'} (status ${res.status})`
}

async function main() {
  // Parse SEED_* from .env.local without echoing values.
  const fs = await import('node:fs')
  const envLines = fs.readFileSync('.env.local', 'utf8').split('\n')
  const getEnv = (name: string) =>
    envLines
      .find((l) => l.startsWith(`${name}=`))
      ?.slice(name.length + 1)
      .trim()
      .replace(/^"(.*)"$/, '$1')

  const results: string[] = []
  const record = (label: string, value: string) => results.push(`${label}: ${value}`)

  // --- Cleaner ---
  record('cleaner login', await login('dana@loonie.example.com', 'LoonieDemo123!') ? 'OK' : 'FAILED')
  record('cleaner /jobs', await probe('/jobs'))
  record('cleaner /jobs data', await contentProbe('/jobs', 'Standard Clean'))
  record('cleaner /jobs/history', await probe('/jobs/history'))
  record('cleaner /admin (wrong role)', await probe('/admin'))
  jar.clear()

  // --- Customer ---
  record('customer login', await login('marcus@example.com', 'LoonieDemo123!') ? 'OK' : 'FAILED')
  record('customer /dashboard', await probe('/dashboard'))
  record('customer /admin (wrong role)', await probe('/admin'))
  jar.clear()

  // --- Admin (credentials from .env.local, never echoed) ---
  const adminEmail = getEnv('SEED_ADMIN_EMAIL')
  const adminPassword = getEnv('SEED_ADMIN_PASSWORD')
  if (adminEmail && adminPassword) {
    record('admin login', await login(adminEmail, adminPassword) ? 'OK' : 'FAILED')
    record('admin /admin', await probe('/admin'))
    record('admin /admin data', await contentProbe('/admin', 'Needs a cleaner'))
    record('admin /admin/bookings', await probe('/admin/bookings'))
    record('admin /admin/bookings/new', await probe('/admin/bookings/new'))
    record('admin /admin/cleaners', await probe('/admin/cleaners'))
    record('admin /jobs (wrong role)', await probe('/jobs'))
  } else {
    record('admin login', 'SKIPPED (no SEED_ADMIN_* in .env.local)')
  }
  jar.clear()

  console.log(results.join('\n'))
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
