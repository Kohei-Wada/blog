import { describe, it, expect } from 'vitest';
import {
  createSearchIndex,
  search,
  stripMarkdown,
  truncateBody,
  type SearchItem,
} from '@/utils/search';

const createMockSearchItem = (
  id: string,
  title: string,
  description: string,
  tags: string[],
  body = ''
): SearchItem => ({
  id,
  title,
  description,
  tags,
  pubDate: '2025-01-15T00:00:00.000Z',
  url: `/blog/${id}/`,
  body,
});

const mockItems: SearchItem[] = [
  createMockSearchItem(
    'haskell-unix-pipelines',
    'AWKを超えて：HaskellをUnixパイプラインに持ち込む',
    'HaskellをUnixパイプラインで使う方法を解説するチュートリアル',
    ['Haskell', 'ghci', 'shell芸', 'プログラミング']
  ),
  createMockSearchItem(
    'astro-blog',
    'Astroでブログを作る',
    '静的サイトジェネレーターAstroのチュートリアル',
    ['Astro', 'blog', 'SSG', 'プログラミング']
  ),
  createMockSearchItem(
    'react-hooks',
    'React Hooksの使い方',
    'useStateやuseEffectの基本を学ぶチュートリアル',
    ['React', 'JavaScript', 'hooks', 'プログラミング']
  ),
];

describe('Search Utility', () => {
  describe('createSearchIndex', () => {
    it('Fuseインスタンスを作成する', () => {
      const fuse = createSearchIndex(mockItems);
      expect(fuse).toBeDefined();
      expect(typeof fuse.search).toBe('function');
    });
  });

  describe('search', () => {
    it('空文字列で空配列を返す', () => {
      const fuse = createSearchIndex(mockItems);
      const result = search(fuse, '');
      expect(result).toEqual([]);
    });

    it('空白のみで空配列を返す', () => {
      const fuse = createSearchIndex(mockItems);
      const result = search(fuse, '   ');
      expect(result).toEqual([]);
    });

    it('タイトルで完全一致する', () => {
      const fuse = createSearchIndex(mockItems);
      const result = search(fuse, 'Haskell');
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].item.title).toContain('Haskell');
    });

    it('説明文でマッチする', () => {
      const fuse = createSearchIndex(mockItems);
      const result = search(fuse, '静的サイト');
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].item.id).toBe('astro-blog');
    });

    it('タグでマッチする', () => {
      const fuse = createSearchIndex(mockItems);
      const result = search(fuse, 'React');
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].item.tags).toContain('React');
    });

    it('fuzzy matchが機能する（タイポ許容）', () => {
      const fuse = createSearchIndex(mockItems);
      // 'Haskel' (typo, missing one 'l') でも 'Haskell' がマッチ
      const result = search(fuse, 'Haskel');
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].item.title).toContain('Haskell');
    });

    it('日本語で検索できる', () => {
      const fuse = createSearchIndex(mockItems);
      const result = search(fuse, 'ブログ');
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].item.id).toBe('astro-blog');
    });

    it('複数の結果を返す', () => {
      const fuse = createSearchIndex(mockItems);
      // 全てのアイテムに共通するタグ
      const result = search(fuse, 'プログラミング');
      expect(result.length).toBeGreaterThan(1);
    });

    it('スコアが含まれる', () => {
      const fuse = createSearchIndex(mockItems);
      const result = search(fuse, 'Haskell');
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].score).toBeDefined();
      expect(typeof result[0].score).toBe('number');
    });

    it('マッチしない場合は空配列を返す', () => {
      const fuse = createSearchIndex(mockItems);
      const result = search(fuse, 'xxxxxxxxx存在しないキーワード');
      expect(result).toEqual([]);
    });

    it('body 内のキーワードでマッチする', () => {
      const itemsWithBody: SearchItem[] = [
        createMockSearchItem(
          'foo',
          'Foo タイトル',
          'Foo description',
          ['x'],
          'これは秘密の本文です'
        ),
        createMockSearchItem('bar', 'Bar タイトル', 'Bar description', ['y'], 'まったく違う内容'),
      ];
      const fuse = createSearchIndex(itemsWithBody);
      const result = search(fuse, '秘密');
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].item.id).toBe('foo');
    });
  });

  describe('truncateBody', () => {
    it('2000 文字以下はそのまま返す', () => {
      const short = 'x'.repeat(500);
      expect(truncateBody(short)).toBe(short);
    });

    it('2000 文字超は切り詰める', () => {
      const long = 'y'.repeat(3000);
      expect(truncateBody(long).length).toBe(2000);
    });
  });

  describe('stripMarkdown', () => {
    it('見出し記号を除去する', () => {
      expect(stripMarkdown('# Heading\n## Sub\nbody')).toBe('Heading Sub body');
    });

    it('インラインコード `…` のバッククォートを外す', () => {
      expect(stripMarkdown('use `npm install` to set up')).toBe('use npm install to set up');
    });

    it('コードブロックを除去する', () => {
      expect(stripMarkdown('text\n```ts\nconst x = 1;\n```\nmore')).toBe('text more');
    });

    it('リンクは表示テキストだけ残す', () => {
      expect(stripMarkdown('see [docs](https://example.com) for more')).toBe('see docs for more');
    });

    it('画像は除去する', () => {
      expect(stripMarkdown('intro ![alt](x.png) tail')).toBe('intro tail');
    });

    it('強調 (** / *) を外す', () => {
      expect(stripMarkdown('**bold** and *italic* text')).toBe('bold and italic text');
    });

    it('HTML コメントとタグを除去する', () => {
      expect(stripMarkdown('a <!-- hidden --> b <span>c</span> d')).toBe('a b c d');
    });

    it('連続する空白は 1 つに正規化する', () => {
      expect(stripMarkdown('a\n\n\nb   c\td')).toBe('a b c d');
    });
  });
});
