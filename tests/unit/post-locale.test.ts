import { describe, it, expect } from 'vitest';
import { getPostLang, getPostSlug } from '../../src/utils/post-locale';

describe('post-locale', () => {
  it('extracts ja from a JP-locale entry id', () => {
    expect(getPostLang('ja/taskdog-cli-task-management-tool')).toBe('ja');
  });
  it('extracts en from an EN-locale entry id', () => {
    expect(getPostLang('en/taskdog-cli-task-management-tool')).toBe('en');
  });
  it('returns the slug without the locale prefix', () => {
    expect(getPostSlug('ja/taskdog-cli-task-management-tool')).toBe(
      'taskdog-cli-task-management-tool'
    );
    expect(getPostSlug('en/taskdog-cli-task-management-tool')).toBe(
      'taskdog-cli-task-management-tool'
    );
  });
  it('throws for an id that lacks a recognised locale prefix', () => {
    expect(() => getPostLang('no-prefix')).toThrow(/locale prefix/);
  });
});
