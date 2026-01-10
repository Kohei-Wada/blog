import type { CollectionEntry } from 'astro:content';
import type { ArchiveMonth } from '../types/index';
import { ARCHIVE_YEAR_RANGE } from '../constants/ui';

/**
 * ブログ記事を年月ごとにグループ化する
 * @param posts ブログ記事の配列
 * @returns 年月でグループ化されたアーカイブデータ（新しい順）
 */
export function groupPostsByMonth(posts: CollectionEntry<'blog'>[]): ArchiveMonth[] {
  const groups = new Map<string, CollectionEntry<'blog'>[]>();

  // 投稿を年月でグループ化
  posts.forEach(post => {
    const date = new Date(post.data.pubDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 0ベースなので+1
    const key = `${year}-${month.toString().padStart(2, '0')}`;

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(post);
  });

  // アーカイブデータを生成
  const archives: ArchiveMonth[] = Array.from(groups.entries()).map(([key, posts]) => {
    const [yearStr, monthStr] = key.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);

    // 月内の記事を日付順でソート（新しい順）
    const sortedPosts = posts.sort(
      (a, b) => new Date(b.data.pubDate).getTime() - new Date(a.data.pubDate).getTime()
    );

    return {
      year,
      month,
      posts: sortedPosts,
      count: posts.length,
      label: formatArchiveLabel(year, month),
      slug: generateArchiveSlug(year, month),
    };
  });

  // アーカイブを年月順でソート（新しい順）
  return archives.sort((a, b) => {
    if (a.year !== b.year) {
      return b.year - a.year;
    }
    return b.month - a.month;
  });
}

/**
 * アーカイブの表示用ラベルを生成する
 * @param year 年
 * @param month 月
 * @returns 表示用ラベル（例：「2025年8月」）
 */
export function formatArchiveLabel(year: number, month: number): string {
  return `${year}年${month}月`;
}

/**
 * アーカイブのURL用スラグを生成する
 * @param year 年
 * @param month 月
 * @returns URL用スラグ（例：「2025-08」）
 */
export function generateArchiveSlug(year: number, month: number): string {
  return `${year}-${month.toString().padStart(2, '0')}`;
}

/**
 * 最近のアーカイブ月を取得する
 * @param archives アーカイブデータの配列
 * @param limit 取得する件数（デフォルト：6）
 * @returns 最近のアーカイブ月（新しい順）
 */
export function getRecentArchiveMonths(
  archives: ArchiveMonth[],
  limit: number = 6
): ArchiveMonth[] {
  return archives.slice(0, limit);
}

/**
 * 年月スラグから年と月を抽出する
 * @param slug 年月スラグ（例：「2025-08」）
 * @returns { year, month } オブジェクト、無効な場合は null
 */
export function parseArchiveSlug(slug: string): { year: number; month: number } | null {
  const match = slug.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const year = parseInt(match[1]);
  const month = parseInt(match[2]);

  if (
    isNaN(year) ||
    year < ARCHIVE_YEAR_RANGE.MIN ||
    year > ARCHIVE_YEAR_RANGE.MAX ||
    month < 1 ||
    month > 12
  ) {
    return null;
  }

  return { year, month };
}
