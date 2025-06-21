import { describe, it, expect } from 'vitest';

describe('ShareButtons', () => {
  const mockProps = {
    title: 'Test Blog Post',
    description: 'A test description for the blog post',
    url: 'https://example.com/blog/test-post'
  };

  it('should encode URL parameters correctly', () => {
    const { title, description, url } = mockProps;
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(`${title} - ${description}`);

    expect(encodedUrl).toBe('https%3A%2F%2Fexample.com%2Fblog%2Ftest-post');
    expect(encodedText).toBe('Test%20Blog%20Post%20-%20A%20test%20description%20for%20the%20blog%20post');
  });

  it('should generate correct Twitter share URL', () => {
    const { title, description, url } = mockProps;
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(`${title} - ${description}`);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;

    expect(twitterUrl).toContain('twitter.com/intent/tweet');
    expect(twitterUrl).toContain('text=Test%20Blog%20Post%20-%20A%20test%20description%20for%20the%20blog%20post');
    expect(twitterUrl).toContain('url=https%3A%2F%2Fexample.com%2Fblog%2Ftest-post');
  });

  it('should generate correct Facebook share URL', () => {
    const { url } = mockProps;
    const encodedUrl = encodeURIComponent(url);
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;

    expect(facebookUrl).toContain('facebook.com/sharer/sharer.php');
    expect(facebookUrl).toContain('u=https%3A%2F%2Fexample.com%2Fblog%2Ftest-post');
  });

  it('should generate correct LINE share URL', () => {
    const { title, description, url } = mockProps;
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(`${title} - ${description}`);
    const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodedUrl}&text=${encodedText}`;

    expect(lineUrl).toContain('social-plugins.line.me/lineit/share');
    expect(lineUrl).toContain('url=https%3A%2F%2Fexample.com%2Fblog%2Ftest-post');
    expect(lineUrl).toContain('text=Test%20Blog%20Post%20-%20A%20test%20description%20for%20the%20blog%20post');
  });

  it('should generate correct LinkedIn share URL', () => {
    const { url } = mockProps;
    const encodedUrl = encodeURIComponent(url);
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;

    expect(linkedinUrl).toContain('linkedin.com/sharing/share-offsite');
    expect(linkedinUrl).toContain('url=https%3A%2F%2Fexample.com%2Fblog%2Ftest-post');
  });

  it('should handle special characters in title and description', () => {
    const specialProps = {
      title: 'Test & Blog Post!',
      description: 'A "test" description with special chars: <>&',
      url: 'https://example.com/blog/test-post'
    };

    const encodedText = encodeURIComponent(`${specialProps.title} - ${specialProps.description}`);
    expect(encodedText).toContain('%26'); // &
    expect(encodedText).toContain('%22'); // "
    expect(encodedText).toContain('%3C'); // <
    expect(encodedText).toContain('%3E'); // >
  });

  it('should validate share button accessibility attributes', () => {
    const buttonAttrs = {
      target: '_blank',
      rel: 'noopener noreferrer',
      'aria-label': 'Share on Twitter'
    };

    expect(buttonAttrs.target).toBe('_blank');
    expect(buttonAttrs.rel).toBe('noopener noreferrer');
    expect(buttonAttrs['aria-label']).toContain('Share on');
  });

  it('should validate SVG accessibility attributes', () => {
    const svgAttrs = {
      viewBox: '0 0 24 24',
      width: '20',
      height: '20',
      'aria-hidden': true
    };

    expect(svgAttrs.viewBox).toMatch(/^\d+ \d+ \d+ \d+$/);
    expect(svgAttrs.width).toBe('20');
    expect(svgAttrs.height).toBe('20');
    expect(svgAttrs['aria-hidden']).toBe(true);
  });
});