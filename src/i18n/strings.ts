export type Locale = 'ja' | 'en';

const strings = {
  recentPosts: { ja: '最近の記事', en: 'Recent posts' },
  allEntries: { ja: '全エントリ', en: 'All entries' },
  navigation: { ja: 'ナビゲーション', en: 'Navigation' },
  searchPlaceholder: { ja: 'キーワード検索', en: 'Search posts' },
  tagsPage: { ja: 'タグ一覧', en: 'All tags' },
  archivesPage: { ja: 'アーカイブ', en: 'Archives' },
  homeLink: { ja: 'ホーム', en: 'Home' },
  blogLink: { ja: '記事', en: 'Posts' },
  aboutLink: { ja: 'about', en: 'About' },
  jaOnlyNotice: { ja: '(この記事は日本語のみ)', en: '(post is JP-only)' },
  enOnlyNotice: { ja: '(この記事は英語のみ)', en: '(post is EN-only)' },
  fallbackHomeNotice: {
    ja: '対応する翻訳がないためホームに移動しました',
    en: 'No translation — taken to the home page',
  },
  projects: { ja: 'プロジェクト', en: 'Projects' },
  siteSubtitle: { ja: 'ソフトウェアエンジニア', en: 'Software Engineer' },
  siteDescription: {
    ja: 'ようこそ、私の個人的なウェブサイトへ。ここでは、私の技術的な情報やプロジェクト、そして私の個人的な興味について紹介しています。',
    en: 'Engineer in Yokohama. Notes on building tools (taskdog, ttymap, knowledge-gardener) and what I learned along the way.',
  },
  authorBio: {
    ja: 'ソフトウェアエンジニア。Web開発、クラウドインフラ、関数型プログラミングに興味があります。',
    en: 'Software engineer interested in web development, cloud infrastructure, and functional programming.',
  },
  searchNoResults: { ja: '該当する記事はありません', en: 'No matching articles' },
  searchPreviewPrompt: {
    ja: '記事を選択するとプレビューが表示されます',
    en: 'Select an article to preview it',
  },
  // Test fixture: deliberately ja-only so the fallback test has something to assert.
  jaOnlyFixture: { ja: 'fixture値' },
} as const;

export type StringKey = keyof typeof strings;

export function t(key: StringKey, locale: Locale): string {
  const entry = strings[key] as Partial<Record<Locale, string>>;
  return entry[locale] ?? entry.ja ?? key;
}
