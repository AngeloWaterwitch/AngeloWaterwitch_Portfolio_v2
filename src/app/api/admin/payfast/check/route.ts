import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { buildCheckout, payfastConfigured, payfastMode } from '@/lib/payfast';

// Posts a tiny signed checkout to PayFast and reports whether PayFast accepts the merchant details and the signature.
// No payment is made: PayFast only shows a payment page, which nobody opens.
export async function POST() {
  const { error } = await requireAuth();
  if (error) return error;

  const mode = payfastMode();
  if (!payfastConfigured()) {
    return NextResponse.json({ ok: false, mode, message: 'PayFast is not set up yet. Add PAYFAST_MERCHANT_ID and PAYFAST_MERCHANT_KEY (and PAYFAST_PASSPHRASE if you set one) in Vercel, then redeploy.' });
  }

  const site = (process.env.NEXTAUTH_URL ?? 'https://example.com').trim().replace(/^["']+|["']+$/g, '');
  const c = buildCheckout({ mPaymentId: 'check-' + Date.now(), amountCents: 500, itemName: 'Connection test', nameFirst: 'Test', email: 'test@example.com', siteUrl: site });

  try {
    const res = await fetch(c.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(c.fields).toString(),
      redirect: 'manual',
      signal: AbortSignal.timeout(10000),
    });
    const body = (await res.text()).replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

    if (/does not match submitted signature/i.test(body)) {
      return NextResponse.json({ ok: false, mode, message: 'PayFast found your merchant ID and key, but the signature does not match. The passphrase here must be EXACTLY the same as the one in PayFast (Settings, Security). If PayFast has no passphrase, leave PAYFAST_PASSPHRASE empty.' });
    }
    if (/invalid merchant/i.test(body) || /merchant_key|merchant_id/i.test(body) && res.status >= 400) {
      return NextResponse.json({ ok: false, mode, message: 'PayFast does not recognise this merchant ID or key. Check them in your PayFast dashboard, and check you are using the matching (sandbox or live) account.' });
    }
    if (res.status >= 400) {
      return NextResponse.json({ ok: false, mode, message: 'PayFast refused the request: ' + body.slice(0, 200) });
    }
    return NextResponse.json({ ok: true, mode, message: `PayFast accepted the connection (${mode}).` });
  } catch {
    return NextResponse.json({ ok: false, mode, message: 'Could not reach PayFast. Try again in a moment.' });
  }
}
