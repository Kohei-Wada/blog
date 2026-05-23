import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import type { SearchItem } from '../../utils/search';
import { truncateBody, stripMarkdown } from '../../utils/search';
import { formatErrorForLog } from '../../utils/error-utils';
import { getPostLang, getPostSlug } from '../../utils/post-locale';
import { LOCALES } from '../../utils/i18n';

export const getStaticPaths = (() =>
  LOCALES.map(lang => ({ params: { lang } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) => {
  const lang = params.lang;
  try {
    const posts = await getCollection('blog');
    const langPosts = posts.filter(post => getPostLang(post.id) === lang);

    const searchIndex: SearchItem[] = langPosts.map(post => ({
      id: post.id,
      title: post.data.title,
      description: post.data.description,
      tags: post.data.tags,
      pubDate: post.data.pubDate.toISOString(),
      url: `/${lang}/blog/${getPostSlug(post.id)}/`,
      body: truncateBody(stripMarkdown(post.body ?? '')),
    }));

    return new Response(JSON.stringify(searchIndex), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: unknown) {
    console.error(formatErrorForLog(error, 'Failed to generate search index'));
    return new Response(JSON.stringify({ error: 'Failed to generate search index' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};
