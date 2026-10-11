import { cache } from 'react';
import { prisma } from '@/lib/prisma';

/** Theme and branding, read once per request even though both the layout and the page need them. */
export const getThemeAndBranding = cache(async () => {
  const [theme, branding] = await Promise.all([prisma.themeSettings.findFirst(), prisma.branding.findFirst()]);
  return { theme, branding };
});

// Weights each known font actually offers on Google Fonts (asking for one it lacks makes the whole request fail).
const FONT_WEIGHTS: Record<string, string> = {
  'Space Mono': '400;700',
  Syne: '400;600;700;800',
  Inter: '400;500;600;700;800',
  'Playfair Display': '400;600;700;800',
  Raleway: '400;500;600;700;800',
  Oswald: '400;500;600;700',
  'Fira Code': '400;500;700',
  'JetBrains Mono': '400;500;700',
};

/** One Google Fonts URL for just the fonts in use. Unknown font names fall back to the full list so nothing breaks. */
export function fontsUrl(chosen: (string | null | undefined)[]): string {
  const names = [...new Set(['Syne', 'Space Mono', ...chosen.filter((n): n is string => !!n)])];
  const known = names.every((n) => n in FONT_WEIGHTS);
  const list = known ? names : Object.keys(FONT_WEIGHTS);
  return 'https://fonts.googleapis.com/css2?' + list.map((n) => `family=${n.replace(/ /g, '+')}:wght@${FONT_WEIGHTS[n]}`).join('&') + '&display=swap';
}
