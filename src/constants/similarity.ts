// Scoring weights for related posts similarity calculation
export const SIMILARITY_WEIGHTS = {
  TAG_WEIGHT: 0.7,
  DATE_WEIGHT: 0.3,
  RECENT_DAYS: 30,
  MAX_DAYS: 365,
} as const;

export type SimilarityWeights = typeof SIMILARITY_WEIGHTS;
