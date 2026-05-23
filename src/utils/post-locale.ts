import type { Locale } from '../i18n/strings';
import { LOCALES } from './i18n';

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
