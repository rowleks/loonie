import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema'
import { loginSchema } from '@/lib/validators'
import type { JWT } from '@auth/core/jwt'
import type { Session } from '@auth/core/types'

export const { handlers, auth, signIn, signOut } = NextAuth({
  // JWT sessions: required for the Credentials provider and means no session
  // tables are needed. If/when Google OAuth is added (PRD Phase 1 "optional"),
  // revisit the database adapter deliberately.
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: '/signin' },
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (raw) => {
        const parsed = loginSchema.safeParse(raw)
        if (!parsed.success) return null

        const [user] = await db
          .select()
          .from(users)
          .where(and(eq(users.email, parsed.data.email), isNull(users.deactivatedAt)))
          .limit(1)

        if (!user.passwordHash) return null

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash)
        if (!valid) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          orgId: user.orgId,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }): JWT {
      token.id = user.id!
      token.role = user.role!
      token.orgId = user.orgId!
      return token
    },
    session({ session, token }): Session {
      if (token.id && token.role && token.orgId) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.orgId = token.orgId
      }
      return session
    },
  },
})