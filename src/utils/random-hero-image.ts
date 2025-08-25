import placeholder2 from '../assets/hero-images/blog-placeholder-2.jpg';
import placeholder3 from '../assets/hero-images/blog-placeholder-3.jpg';
import placeholder4 from '../assets/hero-images/blog-placeholder-4.jpg';
import placeholder5 from '../assets/hero-images/blog-placeholder-5.jpg';

const placeholderImages = [placeholder2, placeholder3, placeholder4, placeholder5];

/**
 * Select a random hero image based on post ID
 * Always returns the same image for the same post ID
 */
export function getRandomHeroImage(postId: string) {
  // Generate a unique hash value from post ID
  let hash = 0;
  for (let i = 0; i < postId.length; i++) {
    const char = postId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash | 0; // Convert to 32-bit integer
  }

  // Use absolute value as array index
  const index = Math.abs(hash) % placeholderImages.length;
  return placeholderImages[index];
}
