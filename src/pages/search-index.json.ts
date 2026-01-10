import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import type { SearchItem } from '../utils/search';

export const GET: APIRoute = async () => {
  const posts = await getCollection('blog');

  const searchIndex: SearchItem[] = posts.map(post => ({
    id: post.id,
    title: post.data.title,
    description: post.data.description,
    tags: post.data.tags,
    pubDate: post.data.pubDate.toISOString(),
    url: `/blog/${post.id}/`,
  }));

  return new Response(JSON.stringify(searchIndex), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
