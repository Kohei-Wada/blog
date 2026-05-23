// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import expressiveCode from 'astro-expressive-code';

// https://astro.build/config
export default defineConfig({
  site: 'https://wada-dev.com/',
  i18n: {
    defaultLocale: 'ja',
    locales: ['ja', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    expressiveCode({
      themes: ['solarized-light'],
      // Force a single frame variant across all fenced blocks so shell/bash
      // blocks don't get a different (terminal) chrome than e.g. ts/js blocks.
      defaultProps: {
        frame: 'code',
      },
      styleOverrides: {
        borderRadius: '4px',
        // Use the site's primary monospace stack everywhere — without this
        // override the syntax-highlighted spans fall back to the bundled
        // `ui-monospace, SFMono-Regular, ...` stack, which clashes with the
        // surrounding `JetBrains Mono` body text.
        codeFontFamily: 'var(--font-mono)',
        uiFontFamily: 'var(--font-mono)',
        // Match the inline-code background (--bg-alt) so inline and block
        // code share a single paper tone instead of two slightly different
        // creams (#ece4cf vs Solarized Light's #fdf6e3).
        codeBackground: 'var(--bg-alt)',
        frames: {
          shadowColor: 'transparent',
        },
      },
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
