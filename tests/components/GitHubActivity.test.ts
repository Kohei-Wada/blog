import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createConsoleMock, createFetchMock } from '../../src/test/helpers';

describe('GitHubActivity 環境変数制御', () => {
  let consoleMock: ReturnType<typeof createConsoleMock>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    consoleMock = createConsoleMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    consoleMock.restoreConsole();
  });

  it('DISABLE_GITHUB_API=trueの時、API呼び出しをスキップしてモックデータを返す', async () => {
    vi.stubEnv('PUBLIC_DISABLE_GITHUB_API', 'true');
    const mockFetch = createFetchMock();

    const { fetchGitHubData } = await import('../../src/utils/github-api.js');
    const result = await fetchGitHubData();

    // APIが呼ばれないことを確認
    expect(mockFetch).not.toHaveBeenCalled();
    // 適切なログが出力されることを確認
    expect(consoleMock.mockConsole.log).toHaveBeenCalledWith(
      'GitHub API disabled in development mode - using mock data'
    );
    // モックデータが返されることを確認
    expect(result.events).toBeDefined();
    expect(result.repos).toBeDefined();
  });

  it('DISABLE_GITHUB_API=falseの時、API呼び出しを実行する', async () => {
    vi.stubEnv('PUBLIC_DISABLE_GITHUB_API', 'false');
    const mockFetch = createFetchMock([[], []]);

    const { fetchGitHubData } = await import('../../src/utils/github-api.js');
    await fetchGitHubData();

    // APIが呼ばれることを確認
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      'https://api.github.com/users/Kohei-Wada/events/public?per_page=10'
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      'https://api.github.com/users/Kohei-Wada/repos?sort=pushed&per_page=5'
    );
    // 無効化ログが出力されないことを確認
    expect(consoleMock.mockConsole.log).not.toHaveBeenCalledWith(
      'GitHub API disabled in development mode'
    );
  });
});
