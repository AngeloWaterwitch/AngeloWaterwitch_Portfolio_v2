/**
 * The public address of the site, with no trailing slash. Used for the sitemap, canonical links and social previews.
 * NEXTAUTH_URL is already set to the live address (and is what has to change when a custom domain is added), so it comes first.
 */
export function siteUrl(): string {
  const clean = (v: string | undefined) => (v ?? '').trim().replace(/^["']+|["']+$/g, '').replace(/\/+$/, '');
  const explicit = clean(process.env.NEXT_PUBLIC_SITE_URL) || clean(process.env.NEXTAUTH_URL);
  if (explicit) return explicit;
  const vercel = clean(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  if (vercel) return vercel.startsWith('http') ? vercel : `https://${vercel}`;
  return 'http://localhost:3000';
}
