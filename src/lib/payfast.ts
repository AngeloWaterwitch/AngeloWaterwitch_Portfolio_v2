import { createHash } from 'node:crypto';
import { lookup } from 'node:dns/promises';

/**
 * PayFast (South African payment gateway) helpers: building the signed checkout form, and verifying the
 * server-to-server "ITN" confirmation. The browser being sent back to our site proves nothing; only a verified ITN
 * marks a payment as paid.
 */

const clean = (v: string | undefined) => (v ?? '').trim().replace(/^["']+|["']+$/g, '');

export type PayfastMode = 'sandbox' | 'live';

export function payfastMode(): PayfastMode {
  return clean(process.env.PAYFAST_MODE).toLowerCase() === 'live' ? 'live' : 'sandbox';
}

export function payfastConfigured(): boolean {
  return !!(clean(process.env.PAYFAST_MERCHANT_ID) && clean(process.env.PAYFAST_MERCHANT_KEY));
}

const HOSTS = { live: 'www.payfast.co.za', sandbox: 'sandbox.payfast.co.za' } as const;
export const processUrl = (mode = payfastMode()) => `https://${HOSTS[mode]}/eng/process`;
const validateUrl = (mode = payfastMode()) => `https://${HOSTS[mode]}/eng/query/validate`;

/** PHP-style urlencode, which is what PayFast uses to build and check signatures. */
export function phpUrlEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/[!'()*~]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())
    .replace(/%20/g, '+');
}

/** MD5 of the field string, in the order given, skipping blanks, with the passphrase appended when one is set. */
export function signFields(fields: [string, string][], passphrase = clean(process.env.PAYFAST_PASSPHRASE)): string {
  const parts = fields
    .filter(([k, v]) => k !== 'signature' && v !== undefined && String(v).trim() !== '')
    .map(([k, v]) => `${k}=${phpUrlEncode(String(v).trim())}`);
  if (passphrase) parts.push(`passphrase=${phpUrlEncode(passphrase)}`);
  return createHash('md5').update(parts.join('&')).digest('hex');
}

export type CheckoutInput = {
  mPaymentId: string;
  amountCents: number;
  itemName: string;
  itemDescription?: string;
  nameFirst: string;
  nameLast?: string;
  email: string;
  siteUrl: string; // e.g. https://angelo-waterwitch-portfolio-v2.vercel.app
};

/** The signed form fields the browser posts to PayFast's hosted checkout. Field order matters for the signature. */
export function buildCheckout(input: CheckoutInput) {
  const siteUrl = input.siteUrl.replace(/\/$/, '');
  const fields: [string, string][] = [
    ['merchant_id', clean(process.env.PAYFAST_MERCHANT_ID)],
    ['merchant_key', clean(process.env.PAYFAST_MERCHANT_KEY)],
    ['return_url', `${siteUrl}/client?payment=return&ref=${encodeURIComponent(input.mPaymentId)}`],
    ['cancel_url', `${siteUrl}/client?payment=cancelled&ref=${encodeURIComponent(input.mPaymentId)}`],
    ['notify_url', `${siteUrl}/api/payfast/notify`],
    ['name_first', input.nameFirst.slice(0, 100)],
    ['name_last', (input.nameLast ?? '').slice(0, 100)],
    ['email_address', input.email.slice(0, 100)],
    ['m_payment_id', input.mPaymentId],
    ['amount', (input.amountCents / 100).toFixed(2)],
    ['item_name', input.itemName.slice(0, 100)],
    ['item_description', (input.itemDescription ?? '').slice(0, 255)],
  ];
  const signature = signFields(fields);
  return {
    action: processUrl(),
    // blank fields are left out so the posted form matches what was signed
    fields: [...fields.filter(([, v]) => String(v).trim() !== ''), ['signature', signature] as [string, string]],
  };
}

// ─── ITN verification ───────────────────────────────────────

/** Re-computes the signature over the notification exactly as received (field order preserved). */
export function verifyItnSignature(pairs: [string, string][]): boolean {
  const received = pairs.find(([k]) => k === 'signature')?.[1];
  if (!received) return false;
  const expected = signFields(pairs.filter(([k]) => k !== 'signature'));
  return received.toLowerCase() === expected;
}

/** True when the request came from one of PayFast's own servers (checked against their published hostnames). */
export async function isPayfastIp(ip: string): Promise<boolean> {
  const hosts = ['www.payfast.co.za', 'sandbox.payfast.co.za', 'w1w.payfast.co.za', 'w2w.payfast.co.za'];
  const allowed = new Set<string>();
  await Promise.all(
    hosts.map(async (h) => {
      try {
        for (const a of await lookup(h, { all: true })) allowed.add(a.address);
      } catch { /* host not resolvable: skip it */ }
    }),
  );
  return allowed.has(ip.replace(/^::ffff:/, ''));
}

/** Asks PayFast to confirm it really sent this notification. */
export async function confirmWithPayfast(body: string): Promise<boolean> {
  try {
    const res = await fetch(validateUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(8000),
    });
    const text = (await res.text()).trim();
    if (text !== 'VALID') console.error('[payfast] confirmation was not VALID:', res.status, text.slice(0, 80));
    return text === 'VALID';
  } catch (err) {
    const e = err as Error & { cause?: { code?: string } };
    console.error('[payfast] could not reach PayFast to confirm a payment:', e.name, e.cause?.code ?? '', e.message);
    return false;
  }
}

/** Tests may skip the two network checks, but never in production. */
export const skipNetworkChecks = () => process.env.NODE_ENV !== 'production' && process.env.PAYFAST_SKIP_VERIFY === '1';
