// 共通の型定義

export interface MarkdownHeading {
  depth: number;
  slug: string;
  text: string;
}

export interface TocItem {
  depth: number;
  slug: string;
  text: string;
  subheadings: TocItem[];
}

export interface GitHubEvent {
  id: string;
  type: string;
  repo: {
    name: string;
  };
  created_at: string;
  payload: {
    commits?: Array<{
      message: string;
      sha: string;
    }>;
    pull_request?: {
      title: string;
    };
    issue?: {
      title: string;
    };
  };
}

export interface GitHubRepo {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  updated_at: string;
  pushed_at: string;
}
