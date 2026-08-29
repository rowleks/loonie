import fs from 'node:fs'
import { defineConfig } from 'drizzle-kit'

// drizzle-kit doesn't load Next.js env files — read .env.local ourselves.
// Values are never written here; only names are referenced.
for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const match = line.match(/^\s*([A-Z0-9_]+)="(.*)"\s*$/)
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2]
}

export default defineConfig({
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
