import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import LangSwitcher from '../../src/components/shared/LangSwitcher.astro';

async function render(url: string, props: Record<string, unknown> = {}): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(LangSwitcher, {
    request: new Request(`http://x${url}`),
    props,
  });
}

describe('LangSwitcher', () => {
  it('marks en as active and links to /ja/ from /en/', async () => {
    const html = await render('/en/');
    expect(html).toContain('aria-current="true"');
    expect(html).toMatch(/<a [^>]*href="\/ja\/"/);
    expect(html).toContain('en');
    expect(html).toContain('ja');
  });

  it('marks ja as active and links to /en/ from /ja/', async () => {
    const html = await render('/ja/');
    expect(html).toMatch(/<a [^>]*href="\/en\/"/);
  });

  it('swaps /ja -> /en when current is /ja/blog/foo', async () => {
    const html = await render('/ja/blog/foo');
    expect(html).toMatch(/href="\/en\/blog\/foo"/);
  });

  it('swaps /en -> /ja when current is /en/blog/foo', async () => {
    const html = await render('/en/blog/foo');
    expect(html).toMatch(/href="\/ja\/blog\/foo"/);
  });

  it('honours an explicit siblingHref override (used when translation is absent)', async () => {
    const html = await render('/en/blog/en-only-post', { siblingHref: '/ja/' });
    expect(html).toMatch(/href="\/ja\/"/);
    expect(html).not.toMatch(/href="\/ja\/blog\/en-only-post"/);
  });
});
