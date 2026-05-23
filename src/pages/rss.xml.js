import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';
import { getPostLang, getPostSlug } from '../utils/post-locale';

export async function GET(context) {
  const posts = await getCollection('blog');
  const jaPosts = posts.filter(post => getPostLang(post.id) === 'ja');
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    items: jaPosts.map(post => ({
      ...post.data,
      link: `/blog/${getPostSlug(post.id)}/`,
    })),
  });
}
