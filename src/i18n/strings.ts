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
  // Test fixture: deliberately ja-only so the fallback test has something to assert.
  jaOnlyFixture: { ja: 'fixture値' },
} as const;

export type StringKey = keyof typeof strings;

export function t(key: StringKey, locale: Locale): string {
  const entry = strings[key] as Partial<Record<Locale, string>>;
  return entry[locale] ?? entry.ja ?? key;
}
