import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Private areas are never meant to appear in search results.
      disallow: ['/admin', '/client', '/api'],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
