import { describe, it, expect } from 'vitest';
import { buildListingCommand } from '../../src/utils/listing-command';

// Minimal Page-like shapes; only the fields buildListingCommand reads.
const page = (currentPage: number, lastPage: number, start: number, end: number) => ({
  currentPage,
  lastPage,
  start,
  end,
});

describe('buildListingCommand', () => {
  it('returns the base command unchanged when there is a single page', () => {
    expect(buildListingCommand('ls -l tags/foo/', page(1, 1, 0, 2))).toBe('ls -l tags/foo/');
  });

  it('appends head -n <count> on the first of several pages', () => {
    expect(buildListingCommand('ls -l blog/', page(1, 2, 0, 19))).toBe('ls -l blog/ | head -n 20');
  });

  it('appends a sed line range on a later page', () => {
    expect(buildListingCommand('ls -l blog/', page(2, 2, 20, 30))).toBe(
      "ls -l blog/ | sed -n '21,31p'"
    );
  });

  it('uses the actual slice bounds for a full middle page', () => {
    expect(buildListingCommand('ls -l blog/', page(2, 3, 20, 39))).toBe(
      "ls -l blog/ | sed -n '21,40p'"
    );
  });
});
