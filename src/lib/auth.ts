import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { verifyRecaptcha } from '@/lib/recaptcha';

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(200),
  recaptchaToken: z.string().optional(),
});

// Shared dummy hash so a wrong email costs the same time as a wrong password.
const DUMMY_HASH = '$2b$12$y/Z4BITCYNZWdICcnOiJruPgzXqsWkzGIqUFRBIMj1sjWiTbZyeyq';

let loginLimiter: Ratelimit | null = null;
function getLimiter() {
  if (loginLimiter) return loginLimiter;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  loginLimiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    prefix: 'rl:admin-login',
  });
  return loginLimiter;
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) {
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

async function checkPassword(password: string): Promise<boolean> {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (hash) return bcrypt.compare(password, hash);

  // Legacy fallback so the admin is not locked out before the hash is configured.
  const legacy = process.env.ADMIN_PASSWORD;
  if (legacy) {
    console.warn('[auth] ADMIN_PASSWORD_HASH not set; using legacy ADMIN_PASSWORD. Run scripts/hash-password.mjs.');
    return safeEqual(password, legacy);
  }
  await bcrypt.compare(password, DUMMY_HASH);
  return false;
}

function clientIp(request: Request | undefined) {
  const fwd = request?.headers.get('x-forwarded-for');
  return fwd?.split(',')[0]?.trim() || request?.headers.get('x-real-ip') || 'unknown';
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        recaptchaToken: { type: 'text' },
      },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password, recaptchaToken } = parsed.data;

        // 1. Throttle brute force by IP + email.
        const limiter = getLimiter();
        if (limiter) {
          try {
            const { success } = await limiter.limit(`${clientIp(request)}:${email.toLowerCase()}`);
            if (!success) {
              console.warn('[auth] login throttled');
              return null;
            }
          } catch (err) {
            console.error('[auth] rate limiter unavailable:', (err as Error).message);
          }
        }

        // 2. Bot check.
        const captcha = await verifyRecaptcha(recaptchaToken, 'admin_login');
        if (!captcha.ok) {
          console.warn('[auth] reCAPTCHA failed:', captcha.reason);
          return null;
        }

        // 3. Credentials (always run the password check to keep timing uniform).
        const adminEmail = (process.env.ADMIN_EMAIL ?? '').toLowerCase();
        const passwordOk = await checkPassword(password);
        const emailOk = adminEmail !== '' && safeEqual(email.toLowerCase(), adminEmail);

        if (emailOk && passwordOk) {
          return { id: 'admin', email: adminEmail, name: 'Angelo Waterwitch', role: 'ADMIN' } as any;
        }
        console.warn('[auth] failed login attempt');
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as any).role;
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as any).role = token.role;
      return session;
    },
  },
  pages: { signIn: '/admin/login' },
  session: { strategy: 'jwt', maxAge: 2 * 60 * 60 },
});
