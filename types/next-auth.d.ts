import type { DefaultSession } from 'next-auth'
import type { UserRole } from '@/db/schema'

declare module 'next-auth' {
  interface User {
    role?: UserRole
    orgId?: string
  }

  interface Session {
    user: {
      id: string
      role: UserRole
      orgId: string
    } & DefaultSession['user']
  }
}

// `JWT` is declared in `@auth/core/jwt` — `next-auth/jwt` only star-re-exports
// it (`export * from "@auth/core/jwt"`), and TypeScript module augmentation
// does not merge through star re-exports. Augment the declaring module or the
// extra fields never land on `JWT`.
declare module '@auth/core/jwt' {
  interface JWT {
    id?: string
    role?: UserRole
    orgId?: string
  }
}
