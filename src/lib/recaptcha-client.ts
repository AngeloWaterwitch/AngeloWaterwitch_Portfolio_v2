'use client';

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, opts: { action: string }) => Promise<string>;
    };
  }
}

let loader: Promise<void> | null = null;

function loadScript(siteKey: string): Promise<void> {
  if (loader) return loader;
  loader = new Promise<void>((resolve, reject) => {
    if (window.grecaptcha) return resolve();
    const s = document.createElement('script');
    s.id = 'recaptcha-script';
    s.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loader = null;
      reject(new Error('reCAPTCHA failed to load'));
    };
    document.head.appendChild(s);
  });
  return loader;
}

/** Returns a reCAPTCHA v3 token for the given action, or '' if keys are not configured. */
export async function getRecaptchaToken(action: string): Promise<string> {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!siteKey) return '';
  await loadScript(siteKey);
  return new Promise<string>((resolve, reject) => {
    window.grecaptcha!.ready(() => {
      window.grecaptcha!.execute(siteKey, { action }).then(resolve, reject);
    });
  });
}
