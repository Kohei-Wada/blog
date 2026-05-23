// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = 'wada-dev';
export const HOME_TITLE = 'wada';
// Locale-varying copy (subtitle, description, author bio) lives in
// src/i18n/strings.ts — resolve with t(key, locale).
export const GITHUB_URL = 'https://github.com/Kohei-Wada';
export const ZENN_URL = 'https://zenn.dev/koheiwada';
export const QIITA_URL = 'https://qiita.com/program3152019';
export const X_URL = 'https://x.com/koheiwada12';
export const X_HANDLE = '@koheiwada12';

// Social links for structured data (sameAs)
export const SOCIAL_LINKS = [GITHUB_URL, ZENN_URL, QIITA_URL].filter((x): x is string =>
  Boolean(x)
);

// Author information for structured data
export const AUTHOR_NAME = 'Kohei Wada';
export const AUTHOR_IMAGE_URL = 'https://github.com/Kohei-Wada.png';
export const AUTHOR_JOB_TITLE = 'Software Engineer';

// Pagination
export const POSTS_PER_PAGE = 20;
