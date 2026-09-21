/**
 * Analytics Module for Bubblin'
 *
 * Dynamically retrieves GTM_ID / GA Measurement ID from config.js
 * and embeds Google Analytics (gtag.js) or Google Tag Manager (gtm.js)
 * if a valid ID is present.
 */

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
    GTM_ID?: string;
  }
}

/**
 * Extracts GTM_ID value from config.js source text.
 * Supports:
 *   const GTM_ID = '...';
 *   let GTM_ID = '...';
 *   var GTM_ID = '...';
 *   window.GTM_ID = '...';
 *   export const GTM_ID = '...';
 */
export function parseGtmIdFromText(text: string): string | null {
  const match = text.match(/(?:(?:export\s+)?(?:const|let|var)\s+|window\.)?GTM_ID\s*=\s*['"`]([^'"`]+)['"`]/);
  if (match && match[1]) {
    const id = match[1].trim();
    if (id.length > 0 && !id.includes('YOUR_') && !id.includes('XXX')) {
      return id;
    }
  }
  return null;
}

/**
 * Attempts to retrieve GTM_ID from:
 * 1. Global window.GTM_ID
 * 2. Top-level lexical GTM_ID (if already loaded)
 * 3. Fetching ./config.js
 * 4. Fallback dynamic <script> element injection (useful for file:// protocol)
 */
export async function getGtmId(): Promise<string | null> {
  // 1. Check window.GTM_ID
  if (typeof window !== 'undefined' && window.GTM_ID && typeof window.GTM_ID === 'string') {
    const id = window.GTM_ID.trim();
    if (id.length > 0) return id;
  }

  // 2. Check global lexical scope (if config.js was loaded as classic script)
  try {
    const evalId = new Function("return typeof GTM_ID !== 'undefined' ? GTM_ID : null")();
    if (evalId && typeof evalId === 'string') {
      const id = evalId.trim();
      if (id.length > 0) return id;
    }
  } catch {
    // Ignore scope evaluation errors
  }

  // 3. Try fetching ./config.js
  try {
    const response = await fetch('./config.js', { cache: 'no-cache' });
    if (response.ok) {
      const text = await response.text();
      const id = parseGtmIdFromText(text);
      if (id) return id;
    }
  } catch {
    // Fetch may fail on file:// or network error
  }

  // 4. Fallback: dynamically inject <script src="./config.js">
  if (typeof document !== 'undefined') {
    try {
      const loaded = await new Promise<boolean>((resolve) => {
        const script = document.createElement('script');
        script.src = './config.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.head.appendChild(script);
      });

      if (loaded) {
        if (window.GTM_ID && typeof window.GTM_ID === 'string' && window.GTM_ID.trim().length > 0) {
          return window.GTM_ID.trim();
        }
        const evalId = new Function("return typeof GTM_ID !== 'undefined' ? GTM_ID : null")();
        if (evalId && typeof evalId === 'string' && evalId.trim().length > 0) {
          return evalId.trim();
        }
      }
    } catch {
      // Ignore script load failure
    }
  }

  return null;
}

/**
 * Embeds Google Analytics (gtag.js) or Google Tag Manager (gtm.js) into document.head.
 */
export function embedGoogleAnalytics(id: string): void {
  if (!id || typeof document === 'undefined') return;

  // Avoid duplicate injection
  if (document.getElementById('ga-gtag-script') || document.getElementById('gtm-script')) {
    return;
  }

  // If container ID starts with GTM-, embed Google Tag Manager
  if (id.startsWith('GTM-')) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      'gtm.start': new Date().getTime(),
      event: 'gtm.js'
    });

    const script = document.createElement('script');
    script.id = 'gtm-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(script);
    console.log(`[Bubblin] Google Tag Manager embedded: ${id}`);
    return;
  }

  // Otherwise (e.g. G-XXXXXXXXXX or legacy UA-), embed Google Analytics (gtag.js)
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer!.push(args);
  }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', id);

  const script = document.createElement('script');
  script.id = 'ga-gtag-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);
  console.log(`[Bubblin] Google Analytics embedded: ${id}`);
}

/**
 * Helper to track custom events in Google Analytics if initialized.
 */
export function trackEvent(eventName: string, params?: Record<string, any>): void {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
}

/**
 * Main initialization entry point.
 * Checks config.js for GTM_ID and embeds the Google Analytics tag if found.
 */
export async function initAnalytics(): Promise<string | null> {
  try {
    const id = await getGtmId();
    if (id) {
      embedGoogleAnalytics(id);
      return id;
    }
  } catch (err) {
    console.warn('[Bubblin] Analytics init warning:', err);
  }
  return null;
}
