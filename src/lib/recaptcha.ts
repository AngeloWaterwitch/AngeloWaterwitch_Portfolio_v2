const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const MIN_SCORE = 0.5;

export type RecaptchaResult = { ok: boolean; reason?: string };

/**
 * Verifies a reCAPTCHA v3 token server-side.
 * Fails closed in production. Only skips when no secret is configured AND
 * we are not in production (local development without keys).
 */
export async function verifyRecaptcha(
  token: string | undefined | null,
  expectedAction: string,
): Promise<RecaptchaResult> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[recaptcha] RECAPTCHA_SECRET_KEY is not set in production');
      return { ok: false, reason: 'not-configured' };
    }
    return { ok: true, reason: 'skipped-dev' };
  }

  if (!token) return { ok: false, reason: 'missing-token' };

  try {
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();

    if (!data.success) {
      return { ok: false, reason: (data['error-codes'] || []).join(',') || 'rejected' };
    }
    if (data.action !== expectedAction) return { ok: false, reason: 'action-mismatch' };
    if (typeof data.score === 'number' && data.score < MIN_SCORE) {
      return { ok: false, reason: 'low-score' };
    }
    return { ok: true };
  } catch (err) {
    console.error('[recaptcha] verification request failed:', (err as Error).message);
    return { ok: false, reason: 'verify-unreachable' };
  }
}
