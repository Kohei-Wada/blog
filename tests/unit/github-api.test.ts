import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { formatRelativeDate } from '@/utils/github-api';

describe('github-api', () => {
  describe('formatRelativeDate', () => {
    // Set fixed time for testing
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should display "今日" for today', () => {
      const today = new Date('2024-06-15T10:00:00.000Z');
      expect(formatRelativeDate(today)).toBe('今日');
    });

    it('should display "昨日" for yesterday', () => {
      const yesterday = new Date('2024-06-14T12:00:00.000Z');
      expect(formatRelativeDate(yesterday)).toBe('昨日');
    });

    it('should display "N日前" for 2-6 days ago', () => {
      const twoDaysAgo = new Date('2024-06-13T12:00:00.000Z');
      expect(formatRelativeDate(twoDaysAgo)).toBe('2日前');

      const sixDaysAgo = new Date('2024-06-09T12:00:00.000Z');
      expect(formatRelativeDate(sixDaysAgo)).toBe('6日前');
    });

    it('should display "N週間前" for 7-29 days ago', () => {
      const oneWeekAgo = new Date('2024-06-08T12:00:00.000Z');
      expect(formatRelativeDate(oneWeekAgo)).toBe('1週間前');

      const twoWeeksAgo = new Date('2024-06-01T12:00:00.000Z');
      expect(formatRelativeDate(twoWeeksAgo)).toBe('2週間前');

      const threeWeeksAgo = new Date('2024-05-25T12:00:00.000Z');
      expect(formatRelativeDate(threeWeeksAgo)).toBe('3週間前');
    });

    it('should display "Nヶ月前" for 30+ days ago', () => {
      const oneMonthAgo = new Date('2024-05-15T12:00:00.000Z');
      expect(formatRelativeDate(oneMonthAgo)).toBe('1ヶ月前');

      const twoMonthsAgo = new Date('2024-04-15T12:00:00.000Z');
      expect(formatRelativeDate(twoMonthsAgo)).toBe('2ヶ月前');

      const sixMonthsAgo = new Date('2023-12-15T12:00:00.000Z');
      expect(formatRelativeDate(sixMonthsAgo)).toBe('6ヶ月前');
    });

    it('should correctly process Date objects', () => {
      const date = new Date('2024-06-15T00:00:00.000Z');
      const result = formatRelativeDate(date);
      expect(typeof result).toBe('string');
    });
  });
});
