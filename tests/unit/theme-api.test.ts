import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * window.theme API のテスト
 *
 * このテストは BaseHead.astro で定義される window.theme API の仕様を検証します。
 * 実際の API は is:inline スクリプトで定義されるため、
 * ここではその期待される動作をシミュレートしてテストします。
 */

// localStorage モック
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

type Theme = 'light' | 'dark';

// window.theme API の実装（テスト用）
// 実際の実装は BaseHead.astro の is:inline スクリプト内にあります
function createThemeAPI(storage: typeof localStorageMock) {
  const STORAGE_KEY = 'theme-preference';

  const getSystemTheme = (): Theme =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  const getStoredTheme = (): Theme | null => storage.getItem(STORAGE_KEY) as Theme | null;

  const getTheme = (): Theme => getStoredTheme() || getSystemTheme();

  const setTheme = (theme: Theme): void => {
    document.documentElement.setAttribute('data-theme', theme);
    storage.setItem(STORAGE_KEY, theme);
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme } }));
  };

  const toggle = (): void => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    setTheme(current === 'light' ? 'dark' : 'light');
  };

  return { STORAGE_KEY, getSystemTheme, getStoredTheme, getTheme, setTheme, toggle };
}

describe('theme API', () => {
  let themeAPI: ReturnType<typeof createThemeAPI>;
  let storage: typeof localStorageMock;

  beforeEach(() => {
    // localStorage モックを初期化
    storage = {
      getItem: vi.fn((key: string) => localStorageMock.getItem(key)),
      setItem: vi.fn((key: string, value: string) => localStorageMock.setItem(key, value)),
      removeItem: vi.fn((key: string) => localStorageMock.removeItem(key)),
      clear: vi.fn(() => localStorageMock.clear()),
    };
    localStorageMock.clear();
    // data-theme 属性をリセット
    document.documentElement.removeAttribute('data-theme');
    // matchMedia をモック（デフォルトはライトモード）
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)' ? false : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
    );
    // API を初期化
    themeAPI = createThemeAPI(storage);
  });

  describe('STORAGE_KEY', () => {
    it('should be "theme-preference"', () => {
      expect(themeAPI.STORAGE_KEY).toBe('theme-preference');
    });
  });

  describe('getSystemTheme', () => {
    it('should return "light" when system prefers light mode', () => {
      vi.stubGlobal(
        'matchMedia',
        vi.fn().mockImplementation((query: string) => ({
          matches: query === '(prefers-color-scheme: dark)' ? false : false,
          media: query,
        }))
      );
      themeAPI = createThemeAPI(storage);
      expect(themeAPI.getSystemTheme()).toBe('light');
    });

    it('should return "dark" when system prefers dark mode', () => {
      vi.stubGlobal(
        'matchMedia',
        vi.fn().mockImplementation((query: string) => ({
          matches: query === '(prefers-color-scheme: dark)' ? true : false,
          media: query,
        }))
      );
      themeAPI = createThemeAPI(storage);
      expect(themeAPI.getSystemTheme()).toBe('dark');
    });
  });

  describe('getStoredTheme', () => {
    it('should return null when no theme is stored', () => {
      expect(themeAPI.getStoredTheme()).toBeNull();
    });

    it('should return stored theme from localStorage', () => {
      localStorageMock.setItem('theme-preference', 'dark');
      expect(themeAPI.getStoredTheme()).toBe('dark');
    });
  });

  describe('getTheme', () => {
    it('should return stored theme if available', () => {
      localStorageMock.setItem('theme-preference', 'dark');
      expect(themeAPI.getTheme()).toBe('dark');
    });

    it('should return system theme if no stored theme', () => {
      expect(themeAPI.getTheme()).toBe('light');
    });
  });

  describe('setTheme', () => {
    it('should set data-theme attribute on document', () => {
      themeAPI.setTheme('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should save theme to localStorage', () => {
      themeAPI.setTheme('dark');
      expect(storage.setItem).toHaveBeenCalledWith('theme-preference', 'dark');
    });

    it('should dispatch theme-changed event', () => {
      const handler = vi.fn();
      window.addEventListener('theme-changed', handler);
      themeAPI.setTheme('dark');
      expect(handler).toHaveBeenCalled();
      expect(handler.mock.calls[0][0].detail).toEqual({ theme: 'dark' });
      window.removeEventListener('theme-changed', handler);
    });
  });

  describe('toggle', () => {
    it('should toggle from light to dark', () => {
      document.documentElement.setAttribute('data-theme', 'light');
      themeAPI.toggle();
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should toggle from dark to light', () => {
      document.documentElement.setAttribute('data-theme', 'dark');
      themeAPI.toggle();
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('should default to light when no theme is set', () => {
      themeAPI.toggle();
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
  });
});
