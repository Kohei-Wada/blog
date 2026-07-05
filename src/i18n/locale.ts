/* global URL */
import type { GetStaticPaths } from 'astro';

export const LOCALES = ['en', 'ja'] as const;

export type Locale = (typeof LOCALES)[number];

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

export function getPostLang(id: string): Locale {
  const prefix = id.split('/')[0];
  if (LOCALES.includes(prefix as Locale)) return prefix as Locale;
  throw new Error(
    `Post id "${id}" lacks a recognised locale prefix (expected one of: ${LOCALES.join(', ')})`
  );
}

export function getPostSlug(id: string): string {
  return id.split('/').slice(1).join('/');
}

export const localeStaticPaths = (() =>
  LOCALES.map(lang => ({ params: { lang } }))) satisfies GetStaticPaths;
