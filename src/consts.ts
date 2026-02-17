// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE: string = 'wada-dev';
export const HOME_TITLE: string = 'wada';
export const SITE_SUBTITLE: string = 'ソフトウェアエンジニア';
export const SITE_DESCRIPTION: string =
  'ようこそ、私の個人的なウェブサイトへ。ここでは、私の技術的な情報やプロジェクト、そして私の個人的な興味について紹介しています。';
export const SITE_HERO_DESCRIPTION: string =
  'ソフトウェア開発、技術記事、そして個人的な学びについて発信しています。';
export const GITHUB_URL: string = 'https://github.com/Kohei-Wada';
export const ZENN_URL: string = 'https://zenn.dev/koheiwada';
export const QIITA_URL: string = 'https://qiita.com/program3152019';
export const X_URL: string = 'https://x.com/koheiwada12';

// Social links for structured data (sameAs)
export const SOCIAL_LINKS: string[] = [GITHUB_URL, ZENN_URL, QIITA_URL].filter((x): x is string =>
  Boolean(x)
);

// Author information for structured data
export const AUTHOR_NAME: string = 'Kohei Wada';
export const AUTHOR_BIO: string =
  'ソフトウェアエンジニア。Web開発、クラウドインフラ、関数型プログラミングに興味があります。';
export const AUTHOR_IMAGE_URL: string = 'https://github.com/Kohei-Wada.png';
export const AUTHOR_JOB_TITLE: string = 'Software Engineer';

// Pagination
export const POSTS_PER_PAGE: number = 6;
