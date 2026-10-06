import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

type Window = Parameters<typeof Ratelimit.slidingWindow>[1];

const limiters = new Map<string, Ratelimit>();

function getLimiter(name: string, max: number, window: Window) {
  const key = `${name}:${max}:${window}`;
  let l = limiters.get(key);
  if (!l) {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
    l = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(max, window),
      prefix: `rl:${name}`,
    });
    limiters.set(key, l);
  }
  return l;
}

export function clientIp(req: Request) {
  const fwd = req.headers.get('x-forwarded-for');
  return fwd?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
}

/**
 * Returns true if the request is allowed. If the rate limiter itself is down
 * we allow the request (and log) so a Redis outage cannot take the site offline;
 * reCAPTCHA and validation still apply.
 */
export async function allowRequest(req: Request, name: string, max = 5, window: Window = '10 m') {
  const limiter = getLimiter(name, max, window);
  if (!limiter) return true;
  try {
    const { success } = await limiter.limit(clientIp(req));
    return success;
  } catch (err) {
    console.error(`[ratelimit:${name}] unavailable:`, (err as Error).message);
    return true;
  }
}
