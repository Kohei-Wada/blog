import type { APIRoute } from 'astro';
import type { SearchItem } from '../../utils/search';
import { truncateBody, stripMarkdown } from '../../utils/search';
import { formatErrorForLog } from '../../utils/error-utils';
import { getPostSlug, localeStaticPaths, type Locale } from '../../i18n/locale';
import { getPostsByLocale } from '../../utils/content-aggregation';

export const getStaticPaths = localeStaticPaths;

export const GET: APIRoute = async ({ params }) => {
  const lang = params.lang as Locale;
  try {
    const langPosts = await getPostsByLocale(lang);

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
