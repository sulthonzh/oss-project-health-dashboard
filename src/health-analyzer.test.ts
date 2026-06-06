import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HealthAnalyzer } from './health-analyzer';
import { GitHubClient } from './github-client';
import { ConfigManager } from './config-manager';
import { BusFactorResult, DiversityResult, ResponseTimeResult, HealthScore } from './types';

// Mock GitHubClient
vi.mock('./github-client');

describe('HealthAnalyzer', () => {
  let analyzer: HealthAnalyzer;
  let mockGitHubClient: jest.Mocked<GitHubClient>;
  let mockConfigManager: jest.Mocked<ConfigManager>;

  beforeEach(() => {
    // Create mock instances
    mockGitHubClient = {
      getRepositoryInfo: vi.fn(),
      getContributors: vi.fn(),
      getIssues: vi.fn(),
      getPullRequests: vi.fn(),
      getCommitHistory: vi.fn(),
    } as any;

    mockConfigManager = {
      getBusFactorThreshold: vi.fn(),
      getResponseTimeThresholds: vi.fn(),
      getHealthWeights: vi.fn(),
    } as any;

    analyzer = new HealthAnalyzer(mockGitHubClient, mockConfigManager);
  });

  describe('calculateBusFactor', () => {
    it('should calculate bus factor correctly with multiple contributors', async () => {
      const mockContributors = [
        { login: 'user1', contributions: 100 },
        { login: 'user2', contributions: 80 },
        { login: 'user3', contributions: 60 },
        { login: 'user4', contributions: 40 },
        { login: 'user5', contributions: 20 },
      ];

      mockGitHubClient.getContributors.mockResolvedValue(mockContributors);
      mockConfigManager.getBusFactorThreshold.mockReturnValue(0.8);

      const result = await analyzer.calculateBusFactor('owner/repo');

      expect(result).toBeInstanceOf(BusFactorResult);
      expect(result.busFactor).toBeGreaterThan(0);
      expect(result.busFactor).toBeLessThanOrEqual(1);
      expect(result.totalContributors).toBe(5);
      expect(result.topContributors.length).toBe(3);
      expect(result.riskLevel).toBe('low');
    });

    it('should identify high bus factor risk with few contributors', async () => {
      const mockContributors = [
        { login: 'user1', contributions: 300 },
        { login: 'user2', contributions: 100 },
      ];

      mockGitHubClient.getContributors.mockResolvedValue(mockContributors);
      mockConfigManager.getBusFactorThreshold.mockReturnValue(0.8);

      const result = await analyzer.calculateBusFactor('owner/repo');

      expect(result.riskLevel).toBe('high');
      expect(result.busFactor).toBeGreaterThan(0.8);
    });
  });

  describe('calculateDiversity', () => {
    it('should calculate diversity metrics correctly', async () => {
      const mockContributors = [
        { login: 'user1', contributions: 100, location: 'USA' },
        { login: 'user2', contributions: 80, location: 'UK' },
        { login: 'user3', contributions: 60, location: 'Japan' },
        { login: 'user4', contributions: 40, location: 'Germany' },
        { login: 'user5', contributions: 20, location: 'USA' },
      ];

      mockGitHubClient.getContributors.mockResolvedValue(mockContributors);

      const result = await analyzer.calculateDiversity('owner/repo');

      expect(result).toBeInstanceOf(DiversityResult);
      expect(result.geographicDiversity).toBeGreaterThan(0);
      expect(result.contributorCount).toBe(5);
      expect(result.uniqueLocations.length).toBe(4);
    });
  });

  describe('calculateResponseTime', () => {
    it('should calculate response time metrics', async () => {
      const mockIssues = [
        { created_at: new Date('2024-01-01').toISOString(), closed_at: new Date('2024-01-03').toISOString() },
        { created_at: new Date('2024-01-02').toISOString(), closed_at: new Date('2024-01-05').toISOString() },
        { created_at: new Date('2024-01-03').toISOString(), closed_at: new Date('2024-01-04').toISOString() },
      ];

      mockGitHubClient.getIssues.mockResolvedValue(mockIssues);
      mockConfigManager.getResponseTimeThresholds.mockReturnValue({
        good: 24 * 60 * 60 * 1000, // 24 hours
        acceptable: 72 * 60 * 60 * 1000, // 72 hours
        poor: 168 * 60 * 60 * 1000, // 1 week
      });

      const result = await analyzer.calculateResponseTime('owner/repo');

      expect(result).toBeInstanceOf(ResponseTimeResult);
      expect(result.averageResponseTime).toBeGreaterThan(0);
      expect(result.medianResponseTime).toBeGreaterThan(0);
      expect(result.p25ResponseTime).toBeGreaterThan(0);
      expect(result.p75ResponseTime).toBeGreaterThan(0);
      expect(result.p95ResponseTime).toBeGreaterThan(0);
    });

    it('should handle open issues without closed dates', async () => {
      const mockIssues = [
        { created_at: new Date('2024-01-01').toISOString(), closed_at: new Date('2024-01-03').toISOString() },
        { created_at: new Date('2024-01-02').toISOString(), closed_at: null },
      ];

      mockGitHubClient.getIssues.mockResolvedValue(mockIssues);

      const result = await analyzer.calculateResponseTime('owner/repo');

      expect(result).toBeInstanceOf(ResponseTimeResult);
      expect(result.averageResponseTime).toBeGreaterThan(0);
    });
  });

  describe('calculateOverallHealthScore', () => {
    it('should calculate overall health score with all metrics', async () => {
      // Mock all the metric calls
      mockGitHubClient.getContributors.mockResolvedValue([
        { login: 'user1', contributions: 100 },
        { login: 'user2', contributions: 50 },
      ]);
      mockGitHubClient.getIssues.mockResolvedValue([
        { created_at: new Date('2024-01-01').toISOString(), closed_at: new Date('2024-01-02').toISOString() },
      ]);
      mockConfigManager.getBusFactorThreshold.mockReturnValue(0.8);
      mockConfigManager.getResponseTimeThresholds.mockReturnValue({
        good: 24 * 60 * 60 * 1000,
        acceptable: 72 * 60 * 60 * 1000,
        poor: 168 * 60 * 60 * 1000,
      });
      mockConfigManager.getHealthWeights.mockReturnValue({
        busFactor: 0.3,
        diversity: 0.2,
        responseTime: 0.2,
        activity: 0.15,
        sustainability: 0.15,
      });

      const result = await analyzer.calculateOverallHealthScore('owner/repo');

      expect(result).toBeInstanceOf(HealthScore);
      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.metrics.busFactor).toBeDefined();
      expect(result.metrics.diversity).toBeDefined();
      expect(result.metrics.responseTime).toBeDefined();
      expect(result.metrics.activity).toBeDefined();
      expect(result.metrics.sustainability).toBeDefined();
    });

    it('should handle missing GitHub data gracefully', async () => {
      mockGitHubClient.getContributors.mockResolvedValue([]);
      mockGitHubClient.getIssues.mockResolvedValue([]);
      mockConfigManager.getBusFactorThreshold.mockReturnValue(0.8);
      mockConfigManager.getResponseTimeThresholds.mockReturnValue({
        good: 24 * 60 * 60 * 1000,
        acceptable: 72 * 60 * 60 * 1000,
        poor: 168 * 60 * 60 * 1000,
      });
      mockConfigManager.getHealthWeights.mockReturnValue({
        busFactor: 0.3,
        diversity: 0.2,
        responseTime: 0.2,
        activity: 0.15,
        sustainability: 0.15,
      });

      const result = await analyzer.calculateOverallHealthScore('owner/repo');

      expect(result).toBeInstanceOf(HealthScore);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });
  });
});