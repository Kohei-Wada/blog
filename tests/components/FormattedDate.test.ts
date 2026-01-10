import { describe, it, expect } from 'vitest';
import { createTestDate, formatTestDate } from '../../src/test/helpers';

describe('FormattedDate', () => {
  it('should format date correctly', () => {
    const testDate = createTestDate('2023-12-25');
    const expectedFormat = formatTestDate(testDate);

    // 日付フォーマットのロジックをテスト
    expect(expectedFormat).toBe('Dec 25, 2023');
  });

  it('should create valid ISO string for datetime attribute', () => {
    const testDate = createTestDate('2023-12-25T10:30:00Z');
    const isoString = testDate.toISOString();

    expect(isoString).toBe('2023-12-25T10:30:00.000Z');
    expect(isoString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
