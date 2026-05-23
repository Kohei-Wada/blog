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
  it('marks ja as active and links to /en/ from /', async () => {
    const html = await render('/');
    expect(html).toContain('aria-current="true"');
    expect(html).toMatch(/<a [^>]*href="\/en\/"/);
    expect(html).toContain('ja');
    expect(html).toContain('en');
  });

  it('marks en as active and links to / from /en/', async () => {
    const html = await render('/en/');
    expect(html).toMatch(/<a [^>]*href="\/"/);
  });

  it('strips /en prefix when current is /en/blog/foo', async () => {
    const html = await render('/en/blog/foo');
    expect(html).toMatch(/href="\/blog\/foo"/);
  });

  it('adds /en prefix when current is /blog/foo', async () => {
    const html = await render('/blog/foo');
    expect(html).toMatch(/href="\/en\/blog\/foo"/);
  });

  it('honours an explicit siblingHref override (used when translation is absent)', async () => {
    const html = await render('/blog/jp-only-post', { siblingHref: '/en/' });
    expect(html).toMatch(/href="\/en\/"/);
    expect(html).not.toMatch(/href="\/en\/blog\/jp-only-post"/);
  });
});
