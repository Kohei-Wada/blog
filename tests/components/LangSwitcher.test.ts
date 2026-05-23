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
  it('marks en as active and links to /ja/ from /', async () => {
    const html = await render('/');
    expect(html).toContain('aria-current="true"');
    expect(html).toMatch(/<a [^>]*href="\/ja\/"/);
    expect(html).toContain('en');
    expect(html).toContain('ja');
  });

  it('marks ja as active and links to / from /ja/', async () => {
    const html = await render('/ja/');
    expect(html).toMatch(/<a [^>]*href="\/"/);
  });

  it('strips /ja prefix when current is /ja/blog/foo', async () => {
    const html = await render('/ja/blog/foo');
    expect(html).toMatch(/href="\/blog\/foo"/);
  });

  it('adds /ja prefix when current is /blog/foo', async () => {
    const html = await render('/blog/foo');
    expect(html).toMatch(/href="\/ja\/blog\/foo"/);
  });

  it('honours an explicit siblingHref override (used when translation is absent)', async () => {
    const html = await render('/blog/en-only-post', { siblingHref: '/ja/' });
    expect(html).toMatch(/href="\/ja\/"/);
    expect(html).not.toMatch(/href="\/ja\/blog\/en-only-post"/);
  });
});
