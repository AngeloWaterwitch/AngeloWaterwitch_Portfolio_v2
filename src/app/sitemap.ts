import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site-url';

// Only public pages. The client portal and admin are private and are left out on purpose.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/privacy`, lastModified: new Date('2026-10-20'), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: new Date('2026-10-20'), changeFrequency: 'yearly', priority: 0.3 },
  ];
}
