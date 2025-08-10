// GitHub API関連の定数
export const GITHUB_API_BASE_URL = 'https://api.github.com';
export const GITHUB_USERNAME = 'Kohei-Wada';

// GitHub APIエンドポイント
export const GITHUB_API_ENDPOINTS = {
  EVENTS: `${GITHUB_API_BASE_URL}/users/${GITHUB_USERNAME}/events/public`,
  REPOS: `${GITHUB_API_BASE_URL}/users/${GITHUB_USERNAME}/repos`,
} as const;

// GitHub API リクエストパラメータ
export const GITHUB_API_PARAMS = {
  EVENTS_PER_PAGE: 10,
  REPOS_PER_PAGE: 5,
  REPOS_SORT: 'pushed',
} as const;

// ソーシャルシェア用URL
export const SOCIAL_SHARE_URLS = {
  TWITTER: 'https://twitter.com/intent/tweet',
  FACEBOOK: 'https://www.facebook.com/sharer/sharer.php',
  LINE: 'https://social-plugins.line.me/lineit/share',
  LINKEDIN: 'https://www.linkedin.com/sharing/share-offsite/',
} as const;

// 外部分析ツール
export const ANALYTICS = {
  GOOGLE_TAG_MANAGER: 'https://www.googletagmanager.com/gtag/js',
  GA_MEASUREMENT_ID: 'G-XGH4QVLSMS',
} as const;

// GitHub関連の表示設定
export const GITHUB_ACTIVITY_CONFIG = {
  MAX_RECENT_COMMITS: 3,
  MAX_ACTIVE_REPOS: 3,
  MAX_EVENTS_FETCH: 10,
} as const;
