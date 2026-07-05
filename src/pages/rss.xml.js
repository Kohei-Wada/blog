import rss from '@astrojs/rss';
import { SITE_TITLE } from '../consts';
import { t } from '../i18n/strings';
import { getPostSlug } from '../i18n/locale';
import { getPostsByLocale } from '../utils/content-aggregation';

export async function GET(context) {
  const enPosts = await getPostsByLocale('en');
  return rss({
    title: SITE_TITLE,
    description: t('siteDescription', 'en'),
    site: context.site,
    items: enPosts.map(post => ({
      ...post.data,
      link: `/en/blog/${getPostSlug(post.id)}/`,
    })),
  });
}
