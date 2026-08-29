/**
 * Loads .env.local before any module that reads DATABASE_URL at import time.
 * tsx doesn't read Next.js env files, so standalone scripts must import this
 * module *before* importing `../db` — ESM evaluates imports top-down, and
 * db/index.ts throws without DATABASE_URL.
 *
 * Same quoted KEY="value" parser as drizzle.config.ts. Values live only in
 * .env.local, never in the repo.
 */
import fs from 'node:fs'
import path from 'node:path'

const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)="(.*)"\s*$/)
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2]
  }
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set — add it to .env.local as KEY="value" first.')
  process.exit(1)
}