import type { CollectionEntry } from 'astro:content';
import { getPostLang, getPostSlug } from './post-locale';

export interface SeeAlsoEntry {
  title: string;
  href: string;
}

export function resolveSeeAlso(
  slugs: string[],
  sourceId: string,
  allPosts: ReadonlyArray<CollectionEntry<'blog'>>
): SeeAlsoEntry[] {
  const sourceLang = getPostLang(sourceId);
  return slugs.map(slug => {
    const found = allPosts.find(
      p => getPostLang(p.id) === sourceLang && getPostSlug(p.id) === slug
    );
    if (!found) {
      throw new Error(
        `seeAlso entry "${slug}" did not resolve in locale "${sourceLang}". ` +
          `Either add the post or remove the entry from frontmatter.`
      );
    }
    return { title: found.data.title, href: `/${sourceLang}/blog/${slug}` };
  });
}
