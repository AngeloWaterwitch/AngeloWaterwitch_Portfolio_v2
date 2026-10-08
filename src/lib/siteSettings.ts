export type LegalLink = { label: string; url: string };
export type SectionHeading = { eyebrow: string; lead: string; highlight: string };

export type SiteSettingsData = {
  footerTagline: string;
  footerCopyright: string;
  footerCredit: string;
  showFooterCredit: boolean;
  showAdminLink: boolean;
  navCtaLabel: string;
  navCtaUrl: string;
  legalLinks: LegalLink[];
  sectionHeadings: Record<string, SectionHeading>;
};

/** Sections whose headings can be edited, with the text currently shown on the site. */
export const DEFAULT_HEADINGS: Record<string, SectionHeading> = {
  about: { eyebrow: 'Who I Am', lead: 'About', highlight: 'Me' },
  skills: { eyebrow: 'What I Use', lead: 'My', highlight: 'Skills' },
  projects: { eyebrow: 'My Work', lead: 'Featured', highlight: 'Projects' },
  services: { eyebrow: 'What I Offer', lead: 'My', highlight: 'Services' },
  timeline: { eyebrow: 'My Journey', lead: 'Experience &', highlight: 'Education' },
  testimonials: { eyebrow: 'Social Proof', lead: 'What Clients', highlight: 'Say' },
  contact: { eyebrow: 'Say Hello', lead: 'Get In', highlight: 'Touch' },
};

export const HEADING_SECTION_IDS = Object.keys(DEFAULT_HEADINGS);

export const DEFAULT_SETTINGS: SiteSettingsData = {
  footerTagline: 'Software & Design Engineer based in Cape Town, South Africa.',
  footerCopyright: 'Angelo Waterwitch',
  footerCredit: 'Designed & Built by Angelo Waterwitch',
  showFooterCredit: true,
  showAdminLink: false,
  navCtaLabel: '',
  navCtaUrl: '',
  legalLinks: [],
  sectionHeadings: {},
};

/** Only allow links that cannot run script: http(s), mailto, tel, in-page (#) and site-relative (/) links. */
export function safeUrl(url: unknown): string {
  if (typeof url !== 'string') return '';
  const u = url.trim();
  if (!u) return '';
  if (/^(https?:\/\/|mailto:|tel:|#|\/(?!\/))/i.test(u)) return u;
  return '';
}

const str = (v: unknown, fallback: string, max = 300) =>
  typeof v === 'string' ? v.slice(0, max) : fallback;

/** Turns a database row (or null) into complete, safe settings, filling gaps with defaults. */
export function resolveSettings(row: any): SiteSettingsData {
  if (!row) return { ...DEFAULT_SETTINGS };

  const legalLinks: LegalLink[] = Array.isArray(row.legalLinks)
    ? row.legalLinks
        .map((l: any) => ({ label: str(l?.label, '', 60).trim(), url: safeUrl(l?.url) }))
        .filter((l: LegalLink) => l.label && l.url)
        .slice(0, 8)
    : [];

  const sectionHeadings: Record<string, SectionHeading> = {};
  if (row.sectionHeadings && typeof row.sectionHeadings === 'object') {
    for (const id of HEADING_SECTION_IDS) {
      const h = row.sectionHeadings[id];
      if (h && typeof h === 'object') {
        sectionHeadings[id] = {
          eyebrow: str(h.eyebrow, DEFAULT_HEADINGS[id].eyebrow, 60),
          lead: str(h.lead, DEFAULT_HEADINGS[id].lead, 60),
          highlight: str(h.highlight, DEFAULT_HEADINGS[id].highlight, 60),
        };
      }
    }
  }

  return {
    footerTagline: str(row.footerTagline, DEFAULT_SETTINGS.footerTagline, 300),
    footerCopyright: str(row.footerCopyright, DEFAULT_SETTINGS.footerCopyright, 100),
    footerCredit: str(row.footerCredit, DEFAULT_SETTINGS.footerCredit, 120),
    showFooterCredit: row.showFooterCredit !== false,
    showAdminLink: row.showAdminLink === true,
    navCtaLabel: str(row.navCtaLabel, '', 40),
    navCtaUrl: safeUrl(row.navCtaUrl),
    legalLinks,
    sectionHeadings,
  };
}

/** Heading text for a section: the admin's override if set, otherwise the built-in default. */
export function headingFor(settings: SiteSettingsData | null | undefined, sectionId: string): SectionHeading {
  return settings?.sectionHeadings?.[sectionId] ?? DEFAULT_HEADINGS[sectionId];
}
