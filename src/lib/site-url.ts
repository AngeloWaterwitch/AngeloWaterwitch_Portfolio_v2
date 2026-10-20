/**
 * The public address of the site, with no trailing slash. Used for the sitemap, canonical links and social previews.
 *
 * Order: an explicit NEXT_PUBLIC_SITE_URL (set this when a custom domain is added), then NEXTAUTH_URL, then the address
 * Vercel itself provides for the production deployment. A localhost value is ignored on Vercel, because a sitemap that
 * points at localhost is useless to Google.
 */
export function siteUrl(): string {
  const clean = (v: string | undefined) => (v ?? '').trim().replace(/^["']+|["']+$/g, '').replace(/\/+$/, '');
  const isLocal = (u: string) => /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/i.test(u);
  const withScheme = (u: string) => (u.startsWith('http') ? u : `https://${u}`);

  const vercel = clean(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  const candidates = [clean(process.env.NEXT_PUBLIC_SITE_URL), clean(process.env.NEXTAUTH_URL)].filter(Boolean);

  for (const c of candidates) {
    if (!(vercel && isLocal(c))) return c;
  }
  if (vercel) return withScheme(vercel);
  return 'http://localhost:3000';
}
