export type Theme = 'light' | 'dark';

export interface ThemeAPI {
  STORAGE_KEY: string;
  getSystemTheme: () => Theme;
  getStoredTheme: () => Theme | null;
  getTheme: () => Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

declare global {
  interface Window {
    theme: ThemeAPI;
  }
}
