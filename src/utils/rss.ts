/* global URL */
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE_TITLE } from '../consts';
import { t } from '../i18n/strings';
import { getPostSlug, type Locale } from '../i18n/locale';
import { getPostsByLocale } from './content-aggregation';

export const FEED_PATHS: Record<Locale, string> = {
  en: '/rss.xml',
  ja: '/ja/rss.xml',
};

export async function localeFeed(locale: Locale, context: APIContext): Promise<Response> {
  const posts = await getPostsByLocale(locale);
  const selfUrl = new URL(FEED_PATHS[locale], context.site);
  return rss({
    title: `${SITE_TITLE} (${locale})`,
    description: t('siteDescription', locale),
    site: new URL(`/${locale}/`, context.site).toString(),
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    customData:
      `<language>${locale}</language>` +
      `<atom:link href="${selfUrl.href}" rel="self" type="application/rss+xml"/>`,
    items: posts.map(post => ({
      ...post.data,
      link: `/${locale}/blog/${getPostSlug(post.id)}/`,
    })),
  });
}
