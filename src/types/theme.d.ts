export type Theme = 'light' | 'dark';

export interface ThemeAPI {
  STORAGE_KEY: string;
  getSystemTheme: () => Theme;
  getStoredTheme: () => string | null;
  getTheme: () => string;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

declare global {
  interface Window {
    theme: ThemeAPI;
  }
}
