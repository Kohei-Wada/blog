import placeholder2 from '../assets/hero-images/blog-placeholder-2.jpg';
import placeholder3 from '../assets/hero-images/blog-placeholder-3.jpg';
import placeholder4 from '../assets/hero-images/blog-placeholder-4.jpg';
import placeholder5 from '../assets/hero-images/blog-placeholder-5.jpg';

const placeholderImages = [placeholder2, placeholder3, placeholder4, placeholder5];

/**
 * 記事IDに基づいてランダムなヒーロー画像を選択する
 * 同じ記事IDに対しては常に同じ画像を返す
 */
export function getRandomHeroImage(postId: string) {
  // 記事IDから一意性のあるハッシュ値を生成
  let hash = 0;
  for (let i = 0; i < postId.length; i++) {
    const char = postId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // 32bit整数に変換
  }

  // 絶対値を取って配列のインデックスとして使用
  const index = Math.abs(hash) % placeholderImages.length;
  return placeholderImages[index];
}
