function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripHtmlTags(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

export function sanitise(input: string): string {
  const decoded = decodeHtmlEntities(input);
  const stripped = stripHtmlTags(decoded);
  return stripped.trim();
}

export function sanitiseObject<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'string') {
      result[key] = sanitise(val);
    } else if (Array.isArray(val)) {
      result[key] = val.map(v => typeof v === 'string' ? sanitise(v) : v);
    } else {
      result[key] = val;
    }
  }
  return result as T;
}