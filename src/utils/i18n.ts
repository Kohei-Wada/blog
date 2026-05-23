/* global URL */
import type { Locale } from '../i18n/strings';

export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALES: readonly Locale[] = ['en', 'ja'] as const;

export function localeFromUrl(url: URL): Locale {
  const segment = url.pathname.split('/').filter(Boolean)[0];
  return segment === 'ja' ? 'ja' : 'en';
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'en' ? 'ja' : 'en';
}

/**
 * Swap the leading locale segment of a path. Both locales are prefixed
 * (`/en/...`, `/ja/...`), so switching is a single-segment replace.
 */
export function siblingUrl(pathname: string, from: Locale, to: Locale): string {
  if (from === to) return pathname;
  const rest = pathname.replace(/^\/(en|ja)(?=\/|$)/, '');
  return `/${to}${rest || '/'}`;
}
