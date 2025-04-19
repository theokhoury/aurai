import { compare } from 'bcrypt-ts';
import NextAuth, { type User, type Session } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { accounts, sessions, user, verificationTokens } from '@/lib/db/schema';
import { db, getUser } from '@/lib/db/queries';

import { authConfig } from './auth.config';

interface ExtendedSession extends Session {
  user: User & { id: string };
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: user,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: 'jwt' },
  ...authConfig,
  providers: [
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        console.log(`[Auth] Authorizing user: ${email}`);
        const userList = await getUser(email);
        
        if (userList.length === 0) { 
          console.log(`[Auth] User not found: ${email}`);
          return null;
        }
        const userRecord = userList[0];
        console.log(`[Auth] User record found:`, userRecord);

        if (!userRecord.password) {
            console.log(`[Auth] User ${email} has no password hash in DB.`);
            return null;
        }
        const passwordsMatch = await compare(password, userRecord.password);
        
        if (!passwordsMatch) { 
            console.log(`[Auth] Password mismatch for user: ${email}`);
            return null;
        }

        console.log(`[Auth] Password match for user: ${email}. Returning user object.`);
        return { 
          id: userRecord.id,
          name: userRecord.name ?? null,
          email: userRecord.email,
          emailVerified: userRecord.emailVerified ?? null,
          image: userRecord.image ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      return token;
    },
    async session({
      session,
      token,
    }: {
      session: ExtendedSession;
      token: any;
    }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
