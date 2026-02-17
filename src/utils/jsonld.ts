import type { ImageMetadata } from 'astro';
import { SITE_TITLE, SOCIAL_LINKS } from '../consts';
import type {
  BlogPostingSchema,
  WebSiteSchema,
  OrganizationSchema,
  PersonSchema,
  JsonLdSchema,
} from '../types';

interface BlogPostingProps {
  title: string;
  description: string;
  url: string;
  datePublished: Date;
  dateModified?: Date;
  image?: ImageMetadata;
  authorName: string;
  authorUrl?: string;
  authorImage?: string;
}

interface WebSiteProps {
  name: string;
  description: string;
  url: string;
}

interface OrganizationProps {
  name: string;
  url: string;
  sameAs: string[];
  logo?: string;
}

interface PersonProps {
  name: string;
  url?: string;
  image?: string;
  sameAs?: string[];
  jobTitle?: string;
  description?: string;
}

export function generateBlogPostingSchema(props: BlogPostingProps): BlogPostingSchema {
  const schema: BlogPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: props.title,
    description: props.description,
    url: props.url,
    datePublished: props.datePublished.toISOString(),
    dateModified: props.dateModified?.toISOString() || props.datePublished.toISOString(),
    author: {
      '@type': 'Person',
      name: props.authorName,
      url: props.authorUrl,
      image: props.authorImage,
      sameAs: SOCIAL_LINKS,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_TITLE,
      url: props.url.split('/').slice(0, 3).join('/'),
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': props.url,
    },
  };

  if (props.image) {
    schema.image = {
      '@type': 'ImageObject',
      url: new globalThis.URL(props.image.src, props.url).toString(),
      width: props.image.width,
      height: props.image.height,
    };
  }

  return schema;
}

export function generateWebSiteSchema(props: WebSiteProps): WebSiteSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: props.name,
    description: props.description,
    url: props.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${props.url}search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function generateOrganizationSchema(props: OrganizationProps): OrganizationSchema {
  const schema: OrganizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: props.name,
    url: props.url,
    sameAs: props.sameAs,
  };

  if (props.logo) {
    schema.logo = {
      '@type': 'ImageObject',
      url: props.logo,
    };
  }

  return schema;
}

export function generatePersonSchema(props: PersonProps): PersonSchema {
  const schema: PersonSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: props.name,
  };

  if (props.url) schema.url = props.url;
  if (props.image) schema.image = props.image;
  if (props.sameAs) schema.sameAs = props.sameAs;
  if (props.jobTitle) schema.jobTitle = props.jobTitle;
  if (props.description) schema.description = props.description;

  return schema;
}

export function combineSchemas(schemas: JsonLdSchema[]): object {
  return {
    '@context': 'https://schema.org',
    '@graph': schemas.map(({ '@context': _context, ...rest }) => {
      void _context;
      return rest;
    }),
  };
}
