// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import rehypePrettyCode from 'rehype-pretty-code';

// https://astro.build/config
export default defineConfig({
  site: 'https://wada-dev.com/',
  integrations: [
    mdx({
      rehypePlugins: [
        [
          rehypePrettyCode,
          {
            theme: 'github-dark',
            keepBackground: false,
            onVisitLine(node) {
              // Prevent lines from collapsing in `display: grid` mode
              if (node.children.length === 0) {
                node.children = [{ type: 'text', value: ' ' }];
              }
            },
            onVisitHighlightedLine(node) {
              node.properties.className.push('highlighted');
            },
            onVisitHighlightedChars(node) {
              node.properties.className = ['chars'];
            },
          },
        ],
      ],
    }),
    sitemap(),
  ],
});
