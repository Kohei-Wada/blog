import { describe, it, expect } from 'vitest';
import type { MarkdownHeading, TocItem } from '../types/index.js';

// TableOfContentsコンポーネントから関数を抽出してテスト
function buildTocStructure(headings: MarkdownHeading[]): TocItem[] {
  const toc: TocItem[] = [];
  const stack: TocItem[] = [];

  for (const heading of headings) {
    // h1は除外（記事タイトルなので）
    if (heading.depth === 1) continue;

    const tocItem: TocItem = {
      ...heading,
      subheadings: [],
    };

    // スタックから現在の深度より深いものを削除
    while (stack.length > 0 && stack[stack.length - 1].depth >= heading.depth) {
      stack.pop();
    }

    if (stack.length === 0) {
      // ルートレベル（h2）
      toc.push(tocItem);
    } else {
      // 親見出しの子として追加
      stack[stack.length - 1].subheadings.push(tocItem);
    }

    stack.push(tocItem);
  }

  return toc;
}

describe('TableOfContents', () => {
  describe('buildTocStructure', () => {
    it('空の見出し配列で空のTOCを返す', () => {
      const result = buildTocStructure([]);
      expect(result).toEqual([]);
    });

    it('h1見出しを除外する', () => {
      const headings: MarkdownHeading[] = [
        { depth: 1, slug: 'title', text: 'メインタイトル' },
        { depth: 2, slug: 'section1', text: 'セクション1' },
      ];

      const result = buildTocStructure(headings);
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('セクション1');
    });

    it('h2見出しのみの場合、フラットな構造を作成', () => {
      const headings: MarkdownHeading[] = [
        { depth: 2, slug: 'section1', text: 'セクション1' },
        { depth: 2, slug: 'section2', text: 'セクション2' },
      ];

      const result = buildTocStructure(headings);
      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('セクション1');
      expect(result[1].text).toBe('セクション2');
      expect(result[0].subheadings).toHaveLength(0);
      expect(result[1].subheadings).toHaveLength(0);
    });

    it('h2とh3の階層構造を正しく作成', () => {
      const headings: MarkdownHeading[] = [
        { depth: 2, slug: 'section1', text: 'セクション1' },
        { depth: 3, slug: 'subsection1', text: 'サブセクション1' },
        { depth: 3, slug: 'subsection2', text: 'サブセクション2' },
        { depth: 2, slug: 'section2', text: 'セクション2' },
        { depth: 3, slug: 'subsection3', text: 'サブセクション3' },
      ];

      const result = buildTocStructure(headings);

      expect(result).toHaveLength(2);

      // セクション1の確認
      expect(result[0].text).toBe('セクション1');
      expect(result[0].subheadings).toHaveLength(2);
      expect(result[0].subheadings[0].text).toBe('サブセクション1');
      expect(result[0].subheadings[1].text).toBe('サブセクション2');

      // セクション2の確認
      expect(result[1].text).toBe('セクション2');
      expect(result[1].subheadings).toHaveLength(1);
      expect(result[1].subheadings[0].text).toBe('サブセクション3');
    });

    it('複雑な階層構造を正しく処理', () => {
      const headings: MarkdownHeading[] = [
        { depth: 2, slug: 'intro', text: 'はじめに' },
        { depth: 3, slug: 'background', text: '背景' },
        { depth: 4, slug: 'problem', text: '課題' },
        { depth: 3, slug: 'approach', text: 'アプローチ' },
        { depth: 2, slug: 'implementation', text: '実装' },
        { depth: 3, slug: 'design', text: '設計' },
      ];

      const result = buildTocStructure(headings);

      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('はじめに');
      expect(result[0].subheadings).toHaveLength(2);
      expect(result[0].subheadings[0].text).toBe('背景');
      expect(result[0].subheadings[1].text).toBe('アプローチ');

      expect(result[1].text).toBe('実装');
      expect(result[1].subheadings).toHaveLength(1);
      expect(result[1].subheadings[0].text).toBe('設計');
    });

    it('深い階層（h4以降）も適切に処理', () => {
      const headings: MarkdownHeading[] = [
        { depth: 2, slug: 'main', text: 'メイン' },
        { depth: 3, slug: 'sub', text: 'サブ' },
        { depth: 4, slug: 'detail', text: '詳細' },
        { depth: 5, slug: 'note', text: '注記' },
      ];

      const result = buildTocStructure(headings);

      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('メイン');
      expect(result[0].subheadings).toHaveLength(1);
      expect(result[0].subheadings[0].text).toBe('サブ');
      expect(result[0].subheadings[0].subheadings).toHaveLength(1);
      expect(result[0].subheadings[0].subheadings[0].text).toBe('詳細');
    });
  });
});
