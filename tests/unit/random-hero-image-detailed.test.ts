import { describe, test, expect } from 'vitest';
import { getRandomHeroImage } from '../../src/utils/random-hero-image';

describe('getRandomHeroImage - Detailed Tests', () => {
  // Assumes there are 4 available images
  const TOTAL_IMAGES = 4;

  test('should distribute properly across different postIds', () => {
    const postIds = [
      'first-post',
      'bread-compression-calorie-reduction',
      'haskell-unix-pipelines',
      'why-i-built-this-blog-and-chose-astro',
      'post-1',
      'post-2',
      'post-3',
      'post-4',
      'post-5',
      'article-a',
      'article-b',
      'article-c',
      'article-d',
      'test-post-1',
      'test-post-2',
      'test-post-3',
      'random-id-123',
      'another-post',
      'sample-article',
    ];

    const imageResults = postIds.map(id => getRandomHeroImage(id));
    const uniqueImages = new Set(imageResults);

    // Verify at least 3 different images (75%) are selected for 20 different postIds
    expect(uniqueImages.size).toBeGreaterThanOrEqual(3);

    // Verify all results are valid images
    imageResults.forEach(image => {
      expect(image).toBeDefined();
    });
  });

  test('should select images for actual blog post IDs', () => {
    const actualPostIds = [
      'first-post',
      'bread-compression-calorie-reduction',
      'haskell-unix-pipelines',
      'why-i-built-this-blog-and-chose-astro',
    ];

    const results: { [key: string]: any } = {};

    actualPostIds.forEach(postId => {
      const image = getRandomHeroImage(postId);
      results[postId] = image;

      // Verify image is selected for each post
      expect(image).toBeDefined();
    });

    // Verify at least 2 different images are selected
    const uniqueActualImages = new Set(Object.values(results));
    expect(uniqueActualImages.size).toBeGreaterThanOrEqual(2);
  });

  test('ハッシュ関数の分散性テスト', () => {
    // 似たような文字列でも異なる結果になるかテスト
    const similarIds = [
      'post-1',
      'post-2',
      'post-3',
      'post-4',
      'article-1',
      'article-2',
      'article-3',
      'article-4',
      'test-a',
      'test-b',
      'test-c',
      'test-d',
    ];

    const results = similarIds.map(id => getRandomHeroImage(id));
    const uniqueResults = new Set(results);

    // 12個の似たようなIDでも、少なくとも3つの異なる画像が選ばれることを期待
    expect(uniqueResults.size).toBeGreaterThanOrEqual(3);
  });

  test('特殊文字や日本語を含むIDでの動作', () => {
    const specialIds = [
      '記事-1',
      'article_with_underscore',
      'article-with-dashes',
      'article.with.dots',
      'article with spaces',
      '123-numeric-start',
      '特殊な記事タイトル',
    ];

    specialIds.forEach(id => {
      const result = getRandomHeroImage(id);
      expect(result).toBeDefined();
    });

    const results = specialIds.map(id => getRandomHeroImage(id));
    const uniqueResults = new Set(results);

    // 特殊文字でも分散されることを確認
    expect(uniqueResults.size).toBeGreaterThanOrEqual(2);
  });

  test('大量のIDでの分散性統計テスト', () => {
    const testIds: string[] = [];

    // 100個のテスト用IDを生成
    for (let i = 0; i < 100; i++) {
      testIds.push(`test-post-${i}`);
    }

    const results = testIds.map(id => getRandomHeroImage(id));
    const imageCounts: { [key: string]: number } = {};

    // 各画像の選択回数をカウント
    results.forEach(image => {
      const key = typeof image === 'string' ? image : image.toString();
      imageCounts[key] = (imageCounts[key] || 0) + 1;
    });

    // 4つの画像すべてが選択されることを確認
    expect(Object.keys(imageCounts).length).toBe(TOTAL_IMAGES);

    // 各画像の選択率が10%〜40%の範囲内であることを確認（完全に均等でなくても許容）
    Object.values(imageCounts).forEach(count => {
      expect(count).toBeGreaterThan(10); // 最低10%
      expect(count).toBeLessThan(40); // 最高40%
    });
  });

  test('一意性の再確認 - 同じIDは常に同じ画像', () => {
    const testId = 'consistency-test';
    const firstResult = getRandomHeroImage(testId);

    // 100回呼び出してもすべて同じ結果であることを確認
    for (let i = 0; i < 100; i++) {
      const result = getRandomHeroImage(testId);
      expect(result).toBe(firstResult);
    }
  });
});
