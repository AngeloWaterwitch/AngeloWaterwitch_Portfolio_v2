import type { CSSProperties, ReactNode } from 'react';

/** Small stroke icons that follow the surrounding text colour. Used instead of emoji, which look different on every phone. */
const PATHS: Record<string, ReactNode> = {
  chat: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />,
  hangup: <g transform="rotate(135 12 12)"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></g>,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>,
  micOff: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3M4 4l16 16" /></>,
  video: <><rect x="3" y="6" width="12" height="12" rx="2" /><path d="M15 10l6-3v10l-6-3z" /></>,
  videoOff: <><rect x="3" y="6" width="12" height="12" rx="2" /><path d="M15 10l6-3v10l-6-3zM4 4l16 16" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  checkCircle: <><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.7 2.7L16 9.5" /></>,
  sparkles: <><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" /><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" /></>,
  settings: <><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></>,
  // skills
  atom: <><ellipse cx="12" cy="12" rx="10" ry="4" /><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" /><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" /><circle cx="12" cy="12" r="1.3" /></>,
  palette: <><path d="M12 3a9 9 0 1 0 0 18c1.2 0 2-.8 2-1.8 0-1-.8-1.3-.8-2.2 0-.9.8-1.5 1.8-1.5H18a3 3 0 0 0 3-3A9 9 0 0 0 12 3z" /><circle cx="7.5" cy="11" r="1" /><circle cx="10" cy="7" r="1" /><circle cx="15" cy="7.5" r="1" /></>,
  bolt: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
  braces: <path d="M8 4c-2 0-3 1-3 3v3c0 1-1 2-2 2 1 0 2 1 2 2v3c0 2 1 3 3 3M16 4c2 0 3 1 3 3v3c0 1 1 2 2 2-1 0-2 1-2 2v3c0 2-1 3-3 3" />,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" /></>,
  server: <><rect x="3" y="4" width="18" height="6" rx="1.5" /><rect x="3" y="14" width="18" height="6" rx="1.5" /><path d="M7 7h.01M7 17h.01" /></>,
  pen: <path d="M4 20l1-4L16 5l3 3L8 19zM14 7l3 3" />,
  database: <><ellipse cx="12" cy="6" rx="8" ry="3" /><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" /></>,
  branch: <><circle cx="6" cy="5" r="2" /><circle cx="6" cy="19" r="2" /><circle cx="18" cy="9" r="2" /><path d="M6 7v10M18 11c0 4-6 3-12 6" /></>,
  code: <path d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 5l-4 14" />,
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20, style, title }: { name: IconName; size?: number | string; style?: CSSProperties; title?: string }) {
  return (
    <svg
      viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}
      style={{ display: 'inline-block', flexShrink: 0, verticalAlign: 'middle', ...style }}
    >
      {PATHS[name]}
    </svg>
  );
}

const SKILL_RULES: [RegExp, IconName][] = [
  [/node|express|server|backend|api|docker|linux|cloud|aws|vercel/i, 'server'],
  [/react|next|vue|angular|svelte/i, 'atom'],
  [/css|sass|scss|tailwind|style|bootstrap/i, 'palette'],
  [/java ?script|\bjs\b/i, 'bolt'],
  [/type ?script|\bts\b|json|php|python|java\b|c#|c\+\+/i, 'braces'],
  [/html|web|seo/i, 'globe'],
  [/figma|design|ui|ux|photoshop|illustrator|canva|logo|brand/i, 'pen'],
  [/sql|database|mongo|postgres|prisma|supabase|firebase/i, 'database'],
  [/git|github/i, 'branch'],
];

/** Picks a clean icon from the skill's name, so it never depends on an emoji. */
export function SkillIcon({ name, size = 'clamp(1.5rem, 4vw, 2rem)' }: { name: string; size?: number | string }) {
  const hit = SKILL_RULES.find(([re]) => re.test(name ?? ''));
  return <Icon name={hit ? hit[1] : 'code'} size={size} style={{ display: 'block', margin: '0 auto 0.6rem', color: 'var(--cr-light)' }} />;
}
