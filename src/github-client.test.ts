import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GitHubClient } from './github-client';

// Mock Octokit
vi.mock('octokit');
const { Octokit } = await import('octokit');

describe('GitHubClient', () => {
  let githubClient: GitHubClient;
  let mockOctokit: any;

  beforeEach(() => {
    // Mock Octokit instance
    mockOctokit = {
      rest: {
        repos: {
          get: vi.fn(),
          listContributors: vi.fn(),
          listIssues: vi.fn(),
          listPullRequests: vi.fn(),
          listCommits: vi.fn(),
        },
      },
    };

    // Mock Octokit constructor
    vi.mocked(Octokit).mockImplementation(() => mockOctokit);

    githubClient = new GitHubClient('test-token');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getRepositoryInfo', () => {
    it('should get repository information successfully', async () => {
      const mockRepoData = {
        id: 123,
        name: 'test-repo',
        full_name: 'owner/test-repo',
        description: 'Test repository',
        stargazers_count: 100,
        watchers_count: 50,
        forks_count: 25,
        open_issues_count: 10,
        language: 'TypeScript',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        archived: false,
        disabled: false,
      };

      mockOctokit.rest.repos.get.mockResolvedValue({ data: mockRepoData });

      const result = await githubClient.getRepositoryInfo('owner/test-repo');

      expect(result).toEqual(mockRepoData);
      expect(mockOctokit.rest.repos.get).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'test-repo',
      });
    });

    it('should throw error when repository not found', async () => {
      mockOctokit.rest.repos.get.mockRejectedValue({
        status: 404,
        message: 'Repository not found',
      });

      await expect(githubClient.getRepositoryInfo('owner/nonexistent')).rejects.toThrow('Repository not found');
    });

    it('should handle rate limit errors gracefully', async () => {
      mockOctokit.rest.repos.get.mockRejectedValue({
        status: 403,
        message: 'API rate limit exceeded',
      });

      await expect(githubClient.getRepositoryInfo('owner/test-repo')).rejects.toThrow('API rate limit exceeded');
    });
  });

  describe('getContributors', () => {
    it('should get contributors successfully', async () => {
      const mockContributors = [
        { login: 'user1', contributions: 100 },
        { login: 'user2', contributions: 50 },
        { login: 'user3', contributions: 25 },
      ];

      mockOctokit.rest.repos.listContributors.mockResolvedValue({ data: mockContributors });

      const result = await githubClient.getContributors('owner/test-repo');

      expect(result).toEqual(mockContributors);
      expect(mockOctokit.rest.repos.listContributors).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'test-repo',
      });
    });

    it('should return empty array for repository with no contributors', async () => {
      mockOctokit.rest.repos.listContributors.mockResolvedValue({ data: [] });

      const result = await githubClient.getContributors('owner/test-repo');

      expect(result).toEqual([]);
    });
  });

  describe('getIssues', () => {
    it('should get issues successfully', async () => {
      const mockIssues = [
        {
          id: 1,
          number: 1,
          title: 'Bug fix',
          body: 'Fix the bug',
          user: { login: 'user1' },
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          closed_at: '2024-01-03T00:00:00Z',
          state: 'closed',
        },
        {
          id: 2,
          number: 2,
          title: 'Feature request',
          body: 'Add new feature',
          user: { login: 'user2' },
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-03T00:00:00Z',
          closed_at: null,
          state: 'open',
        },
      ];

      mockOctokit.rest.repos.listIssues.mockResolvedValue({ data: mockIssues });

      const result = await githubClient.getIssues('owner/test-repo', { state: 'all' });

      expect(result).toEqual(mockIssues);
      expect(mockOctokit.rest.repos.listIssues).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'test-repo',
        state: 'all',
      });
    });

    it('should handle issues filtering parameters', async () => {
      mockOctokit.rest.repos.listIssues.mockResolvedValue({ data: [] });

      await githubClient.getIssues('owner/test-repo', { 
        state: 'open', 
        labels: 'bug,high-priority',
        since: '2024-01-01T00:00:00Z'
      });

      expect(mockOctokit.rest.repos.listIssues).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'test-repo',
        state: 'open',
        labels: 'bug,high-priority',
        since: '2024-01-01T00:00:00Z',
      });
    });
  });

  describe('getPullRequests', () => {
    it('should get pull requests successfully', async () => {
      const mockPRs = [
        {
          id: 1,
          number: 1,
          title: 'Fix bug',
          user: { login: 'user1' },
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          closed_at: '2024-01-03T00:00:00Z',
          state: 'closed',
          merged: true,
        },
        {
          id: 2,
          number: 2,
          title: 'Add feature',
          user: { login: 'user2' },
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-03T00:00:00Z',
          closed_at: null,
          state: 'open',
          merged: false,
        },
      ];

      mockOctokit.rest.repos.listPullRequests.mockResolvedValue({ data: mockPRs });

      const result = await githubClient.getPullRequests('owner/test-repo', { state: 'all' });

      expect(result).toEqual(mockPRs);
      expect(mockOctokit.rest.repos.listPullRequests).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'test-repo',
        state: 'all',
      });
    });
  });

  describe('getCommitHistory', () => {
    it('should get commit history successfully', async () => {
      const mockCommits = [
        {
          sha: 'abc123',
          commit: {
            author: { name: 'user1', email: 'user1@example.com', date: '2024-01-01T00:00:00Z' },
            message: 'Initial commit',
          },
        },
        {
          sha: 'def456',
          commit: {
            author: { name: 'user2', email: 'user2@example.com', date: '2024-01-02T00:00:00Z' },
            message: 'Add feature',
          },
        },
      ];

      mockOctokit.rest.repos.listCommits.mockResolvedValue({ data: mockCommits });

      const result = await githubClient.getCommitHistory('owner/test-repo');

      expect(result).toEqual(mockCommits);
      expect(mockOctokit.rest.repos.listCommits).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'test-repo',
        per_page: 100,
      });
    });

    it('should handle commit history with date range', async () => {
      const mockCommits = [];
      mockOctokit.rest.repos.listCommits.mockResolvedValue({ data: mockCommits });

      const since = new Date('2024-01-01T00:00:00Z');
      const until = new Date('2024-01-31T23:59:59Z');

      await githubClient.getCommitHistory('owner/test-repo', { since, until });

      expect(mockOctokit.rest.repos.listCommits).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'test-repo',
        per_page: 100,
        since: since.toISOString(),
        until: until.toISOString(),
      });
    });
  });

  describe('error handling', () => {
    it('should handle API rate limit errors', async () => {
      mockOctokit.rest.repos.get.mockRejectedValue({
        status: 403,
        message: 'API rate limit exceeded',
        headers: {
          'x-ratelimit-remaining': '0',
          'x-ratelimit-reset': '1640995200',
        },
      });

      await expect(githubClient.getRepositoryInfo('owner/test-repo')).rejects.toThrow('API rate limit exceeded');
    });

    it('should handle authentication errors', async () => {
      mockOctokit.rest.repos.get.mockRejectedValue({
        status: 401,
        message: 'Bad credentials',
      });

      await expect(githubClient.getRepositoryInfo('owner/test-repo')).rejects.toThrow('Bad credentials');
    });

    it('should handle network errors', async () => {
      mockOctokit.rest.repos.get.mockRejectedValue({
        status: 0,
        message: 'Network Error',
      });

      await expect(githubClient.getRepositoryInfo('owner/test-repo')).rejects.toThrow('Network Error');
    });
  });
});