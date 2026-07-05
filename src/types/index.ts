// 共通の型定義
import type { CollectionEntry } from 'astro:content';

export interface ArchiveMonth {
  year: number;
  month: number;
  posts: CollectionEntry<'blog'>[];
  count: number;
  label: string;
  slug: string;
}

// JSON-LD Schema.org types
export interface JsonLdPerson {
  '@type': 'Person';
  name: string;
  url?: string;
  image?: string;
  sameAs?: string[];
}

export interface JsonLdOrganization {
  '@type': 'Organization';
  name: string;
  url?: string;
  logo?: JsonLdImageObject;
}

export interface JsonLdImageObject {
  '@type': 'ImageObject';
  url: string;
  width?: number;
  height?: number;
}

export interface JsonLdWebPage {
  '@type': 'WebPage';
  '@id': string;
}

export interface BlogPostingSchema {
  '@context': string;
  '@type': 'BlogPosting';
  headline: string;
  description: string;
  url: string;
  inLanguage: string;
  datePublished: string;
  dateModified: string;
  author: JsonLdPerson;
  publisher: JsonLdOrganization;
  mainEntityOfPage: JsonLdWebPage;
  image?: JsonLdImageObject;
}

export interface WebSiteSchema {
  '@context': string;
  '@type': 'WebSite';
  name: string;
  description: string;
  url: string;
  inLanguage: string;
}

export interface OrganizationSchema {
  '@context': string;
  '@type': 'Organization';
  name: string;
  url: string;
  sameAs: string[];
  logo?: JsonLdImageObject;
}

export interface PersonSchema {
  '@context': string;
  '@type': 'Person';
  name: string;
  url?: string;
  image?: string;
  sameAs?: string[];
  jobTitle?: string;
  description?: string;
}

export type JsonLdSchema = BlogPostingSchema | WebSiteSchema | OrganizationSchema | PersonSchema;
