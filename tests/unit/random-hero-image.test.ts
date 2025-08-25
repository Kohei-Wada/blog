import { describe, test, expect } from 'vitest';
import { getRandomHeroImage } from '../../src/utils/random-hero-image';

describe('getRandomHeroImage', () => {
  test('should return an image object', () => {
    const result = getRandomHeroImage('test-post-id');
    expect(result).toBeDefined();
    // テスト環境では画像が文字列として扱われる場合がある
    expect(typeof result === 'object' || typeof result === 'string').toBe(true);
  });

  test('should return the same image for the same post ID', () => {
    const postId = 'consistent-post-id';
    const result1 = getRandomHeroImage(postId);
    const result2 = getRandomHeroImage(postId);

    expect(result1).toBe(result2);
  });

  test('should return different images for different post IDs', () => {
    const result1 = getRandomHeroImage('post-1');
    const result2 = getRandomHeroImage('post-2');
    const result3 = getRandomHeroImage('post-3');
    const result4 = getRandomHeroImage('post-4');
    const result5 = getRandomHeroImage('post-5');
    const result6 = getRandomHeroImage('post-6');
    const result7 = getRandomHeroImage('post-7');

    const results = [result1, result2, result3, result4, result5, result6, result7];
    const uniqueResults = new Set(results);

    // 7つの異なるpostIdに対して、少なくとも2つの異なる画像が返されることを確認
    // （完全に異なるとは限らないが、ハッシュ関数により分散されるはず）
    expect(uniqueResults.size).toBeGreaterThan(1);
  });

  test('should handle empty post ID', () => {
    const result = getRandomHeroImage('');
    expect(result).toBeDefined();
    expect(typeof result === 'object' || typeof result === 'string').toBe(true);
  });

  test('should handle special characters in post ID', () => {
    const result = getRandomHeroImage('test-post-id-with-special-chars-123!@#');
    expect(result).toBeDefined();
    expect(typeof result === 'object' || typeof result === 'string').toBe(true);
  });

  test('should handle very long post ID', () => {
    const longPostId = 'a'.repeat(1000);
    const result = getRandomHeroImage(longPostId);
    expect(result).toBeDefined();
    expect(typeof result === 'object' || typeof result === 'string').toBe(true);
  });
});
