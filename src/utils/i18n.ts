/* global URL */
import type { Locale } from '../i18n/strings';

export const DEFAULT_LOCALE: Locale = 'ja';
export const LOCALES: readonly Locale[] = ['ja', 'en'] as const;

export function localeFromUrl(url: URL): Locale {
  const segments = url.pathname.split('/').filter(Boolean);
  return segments[0] === 'en' ? 'en' : 'ja';
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'ja' ? 'en' : 'ja';
}

export function siblingUrl(pathname: string, from: Locale, to: Locale): string {
  if (from === to) return pathname;
  if (to === 'en') {
    // ja → en: prepend /en
    return pathname === '/' ? '/en/' : `/en${pathname}`;
  }
  // en → ja: strip leading /en
  if (pathname === '/en' || pathname === '/en/') return '/';
  return pathname.replace(/^\/en/, '');
}
