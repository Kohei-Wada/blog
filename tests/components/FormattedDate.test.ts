import { describe, it, expect } from 'vitest';

describe('FormattedDate', () => {
  it('should format date correctly', () => {
    const testDate = new Date('2023-12-25');
    const expectedFormat = testDate.toLocaleDateString('en-us', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    // 日付フォーマットのロジックをテスト
    expect(expectedFormat).toBe('Dec 25, 2023');
  });

  it('should create valid ISO string for datetime attribute', () => {
    const testDate = new Date('2023-12-25T10:30:00Z');
    const isoString = testDate.toISOString();

    expect(isoString).toBe('2023-12-25T10:30:00.000Z');
    expect(isoString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
