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

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('reCAPTCHA timed out')), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

function executeOnce(siteKey: string, action: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    window.grecaptcha!.ready(() => {
      window.grecaptcha!.execute(siteKey, { action }).then(resolve, reject);
    });
  });
}

/**
 * Returns a reCAPTCHA v3 token for the given action, or '' if keys are not configured.
 * Retries on a dropped or slow connection so one failed request does not block the user.
 */
export async function getRecaptchaToken(action: string): Promise<string> {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!siteKey) return '';

  const attempts = 3;
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      await withTimeout(loadScript(siteKey), 10000);
      return await withTimeout(executeOnce(siteKey, action), 10000);
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('reCAPTCHA failed');
}
