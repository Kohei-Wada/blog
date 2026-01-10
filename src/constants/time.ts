// Time-related constants (in milliseconds)
export const TIME_MS = {
  ONE_DAY: 86400000, // 24 * 60 * 60 * 1000
  TWO_DAYS: 172800000, // 48 * 60 * 60 * 1000
} as const;

export type TimeMs = typeof TIME_MS;
