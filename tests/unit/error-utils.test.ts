import { describe, it, expect } from 'vitest';
import { getErrorMessage, isError, formatErrorForLog } from '../../src/utils/error-utils';

describe('error-utils', () => {
  describe('getErrorMessage', () => {
    it('should extract message from Error instance', () => {
      const error = new Error('Test error message');
      expect(getErrorMessage(error)).toBe('Test error message');
    });

    it('should handle TypeError', () => {
      const error = new TypeError('Type error message');
      expect(getErrorMessage(error)).toBe('Type error message');
    });

    it('should return string errors as-is', () => {
      expect(getErrorMessage('String error')).toBe('String error');
    });

    it('should return default message for null', () => {
      expect(getErrorMessage(null)).toBe('Unknown error occurred');
    });

    it('should return default message for undefined', () => {
      expect(getErrorMessage(undefined)).toBe('Unknown error occurred');
    });

    it('should return default message for numbers', () => {
      expect(getErrorMessage(123)).toBe('Unknown error occurred');
    });

    it('should return default message for objects', () => {
      expect(getErrorMessage({ foo: 'bar' })).toBe('Unknown error occurred');
    });
  });

  describe('isError', () => {
    it('should return true for Error instances', () => {
      expect(isError(new Error('test'))).toBe(true);
    });

    it('should return true for TypeError', () => {
      expect(isError(new TypeError('test'))).toBe(true);
    });

    it('should return true for RangeError', () => {
      expect(isError(new RangeError('test'))).toBe(true);
    });

    it('should return false for string', () => {
      expect(isError('string')).toBe(false);
    });

    it('should return false for null', () => {
      expect(isError(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isError(undefined)).toBe(false);
    });

    it('should return false for object with message property', () => {
      expect(isError({ message: 'fake error' })).toBe(false);
    });
  });

  describe('formatErrorForLog', () => {
    it('should format error with context', () => {
      const error = new Error('Something went wrong');
      expect(formatErrorForLog(error, 'API')).toBe('[API] Something went wrong');
    });

    it('should format error without context', () => {
      const error = new Error('Something went wrong');
      expect(formatErrorForLog(error)).toBe('Something went wrong');
    });

    it('should handle unknown error types with context', () => {
      expect(formatErrorForLog(null, 'Test')).toBe('[Test] Unknown error occurred');
    });

    it('should handle string errors with context', () => {
      expect(formatErrorForLog('String error', 'Context')).toBe('[Context] String error');
    });
  });
});
