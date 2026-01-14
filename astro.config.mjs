// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import expressiveCode from 'astro-expressive-code';

// https://astro.build/config
export default defineConfig({
  site: 'https://wada-dev.com/',
  integrations: [
    expressiveCode({
      themes: ['github-dark'],
    }),
    mdx(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      serialize(item) {
        // Homepage has highest priority
        if (item.url === 'https://wada-dev.com/') {
          item.priority = 1.0;
          item.changefreq = 'daily';
        }
        // Blog posts have medium priority
        else if (item.url.includes('/blog/')) {
          item.priority = 0.8;
          item.changefreq = 'monthly';
        }
        // Tag and archive pages have lower priority
        else if (item.url.includes('/tags/') || item.url.includes('/archives/')) {
          item.priority = 0.5;
          item.changefreq = 'weekly';
        }
        return item;
      },
    }),
  ],
  vite: {
    build: {
      assetsInlineLimit: 100000,
    },
  },
});
