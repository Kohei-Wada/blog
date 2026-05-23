import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE_TITLE } from '../consts';
import { t } from '../i18n/strings';
import { getPostLang, getPostSlug } from '../utils/post-locale';

export async function GET(context) {
  const posts = await getCollection('blog');
  const enPosts = posts.filter(post => getPostLang(post.id) === 'en');
  return rss({
    title: SITE_TITLE,
    description: t('siteDescription', 'en'),
    site: context.site,
    items: enPosts.map(post => ({
      ...post.data,
      link: `/blog/${getPostSlug(post.id)}/`,
    })),
  });
}
