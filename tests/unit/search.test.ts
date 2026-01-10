import { describe, it, expect } from 'vitest';
import { createSearchIndex, search, type SearchItem } from '@/utils/search';

const createMockSearchItem = (
  id: string,
  title: string,
  description: string,
  tags: string[]
): SearchItem => ({
  id,
  title,
  description,
  tags,
  pubDate: '2025-01-15T00:00:00.000Z',
  url: `/blog/${id}/`,
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
  });
});
