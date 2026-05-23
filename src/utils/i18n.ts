/* global URL */
import type { Locale } from '../i18n/strings';

export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALES: readonly Locale[] = ['en', 'ja'] as const;

export function localeFromUrl(url: URL): Locale {
  const segments = url.pathname.split('/').filter(Boolean);
  return segments[0] === 'ja' ? 'ja' : 'en';
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'en' ? 'ja' : 'en';
}

export function siblingUrl(pathname: string, from: Locale, to: Locale): string {
  if (from === to) return pathname;
  if (to === 'ja') {
    // en → ja: prepend /ja
    return pathname === '/' ? '/ja/' : `/ja${pathname}`;
  }
  // ja → en: strip leading /ja
  if (pathname === '/ja' || pathname === '/ja/') return '/';
  return pathname.replace(/^\/ja/, '');
}
