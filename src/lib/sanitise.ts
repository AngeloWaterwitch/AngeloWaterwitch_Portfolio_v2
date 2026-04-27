import sanitizeHtml from 'sanitize-html';

export function sanitise(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
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