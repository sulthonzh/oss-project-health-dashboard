import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { HealthAnalyzer } from './health-analyzer';
import { GitHubClient } from './github-client';
import { ConfigManager } from './config-manager';
import { DashboardReporter } from './dashboard-reporter';

// Mock dependencies
vi.mock('./health-analyzer');
vi.mock('./github-client');
vi.mock('./config-manager');
vi.mock('./dashboard-reporter');

const { HealthAnalyzer } = await import('./health-analyzer');
const { GitHubClient } = await import('./github-client');
const { ConfigManager } = await import('./config-manager');
const { DashboardReporter } = await import('./dashboard-reporter');

describe('CLI Interface', () => {
  let program: Command;
  let mockHealthAnalyzer: jest.Mocked<HealthAnalyzer>;
  let mockGitHubClient: jest.Mocked<GitHubClient>;
  let mockConfigManager: jest.Mocked<ConfigManager>;
  let mockDashboardReporter: jest.Mocked<DashboardReporter>;

  beforeEach(() => {
    // Setup mocks
    mockHealthAnalyzer = {
      calculateOverallHealthScore: vi.fn(),
    } as any;

    mockGitHubClient = {
      getRepositoryInfo: vi.fn(),
    } as any;

    mockConfigManager = {
      getBusFactorThreshold: vi.fn(),
      getResponseTimeThresholds: vi.fn(),
      getHealthWeights: vi.fn(),
      updateConfig: vi.fn(),
    } as any;

    mockDashboardReporter = {
      generateReport: vi.fn(),
      generateJSONReport: vi.fn(),
      generateCompactReport: vi.fn(),
      generateDetailedReport: vi.fn(),
    } as any;

    // Import and create CLI program
    vi.doMock('commander');
    const { Command } = require('commander');
    program = new Command();

    // Setup CLI commands
    program
      .name('oss-health-check')
      .description('One-command OSS project health analysis')
      .version('1.0.0');

    program
      .command('check')
      .description('Analyze repository health')
      .argument('<repo>', 'GitHub repository (owner/repo)')
      .option('-d, --depth <months>', 'Analysis depth in months', '6')
      .option('-f, --format <format>', 'Output format (terminal|json|compact)', 'terminal')
      .option('-c, --config <path>', 'Config file path')
      .option('--demo', 'Use demo data instead of GitHub API')
      .option('--verbose', 'Verbose output')
      .action(async (repo, options) => {
        await analyzeRepository(repo, options);
      });

    program
      .command('demo')
      .description('Run demo with mock data')
      .option('-f, --format <format>', 'Output format (terminal|json|compact)', 'terminal')
      .option('-v, --verbose', 'Verbose output')
      .action(async (options) => {
        await runDemo(options);
      });

    program
      .command('config')
      .description('Configuration management')
      .option('--init', 'Initialize default config')
      .option('--show', 'Show current config')
      .option('--update <key=value>', 'Update config value')
      .option('--reset', 'Reset to defaults')
      .action(async (options) => {
        await manageConfig(options);
      });

    // Mock command line arguments
    process.argv = ['node', 'index.js', 'check', 'owner/repo'];
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('check command', () => {
    it('should analyze repository successfully', async () => {
      const mockHealthScore = {
        overallScore: 85,
        metrics: {
          busFactor: { score: 90, riskLevel: 'low', busFactor: 0.8, totalContributors: 10, topContributors: [] },
          diversity: { score: 80, geographicDiversity: 0.7, contributorCount: 10, uniqueLocations: [], retentionRate: 0.8 },
          responseTime: { score: 75, averageResponseTime: 36 * 60 * 60 * 1000, medianResponseTime: 24 * 60 * 60 * 1000, p25ResponseTime: 12 * 60 * 60 * 1000, p75ResponseTime: 48 * 60 * 60 * 1000, p95ResponseTime: 72 * 60 * 60 * 1000 },
          activity: { score: 90, commitFrequency: 25, issueResolutionRate: 0.85, prMergeRate: 0.9, lastActivity: new Date().toISOString() },
          sustainability: { score: 80, starGrowthRate: 0.2, contributorGrowthRate: 0.15, issueClosureRate: 0.8, forkCount: 5, lastUpdated: new Date().toISOString() }
        },
        repository: {
          name: 'test-repo',
          full_name: 'owner/test-repo',
          description: 'Test repository',
          stargazers_count: 100,
          forks_count: 5,
          open_issues_count: 10,
          language: 'TypeScript',
          created_at: new Date('2024-01-01T00:00:00Z').toISOString()
        }
      };

      mockHealthAnalyzer.calculateOverallHealthScore.mockResolvedValue(mockHealthScore);
      mockDashboardReporter.generateReport.mockReturnValue('Mock terminal report');

      // Override process.argv for this test
      process.argv = ['node', 'index.js', 'check', 'owner/test-repo', '--format', 'terminal'];

      // Simulate CLI execution
      await new Promise((resolve) => {
        program.parseAsync(['node', 'index.js', 'check', 'owner/test-repo', '--format', 'terminal']).then(resolve);
      });

      expect(mockHealthAnalyzer.calculateOverallHealthScore).toHaveBeenCalledWith('owner/test-repo');
      expect(mockDashboardReporter.generateReport).toHaveBeenCalledWith(mockHealthScore, 'terminal');
    });

    it('should handle GitHub API errors gracefully', async () => {
      mockHealthAnalyzer.calculateOverallHealthScore.mockRejectedValue(new Error('Repository not found'));

      process.argv = ['node', 'index.js', 'check', 'owner/nonexistent', '--format', 'terminal'];

      await expect(async () => {
        await new Promise((resolve) => {
          program.parseAsync(['node', 'index.js', 'check', 'owner/nonexistent', '--format', 'terminal']).then(resolve);
        });
      }).rejects.toThrow('Repository not found');
    });

    it('should support JSON output format', async () => {
      const mockHealthScore = {
        overallScore: 75,
        metrics: {
          busFactor: { score: 80, riskLevel: 'medium', busFactor: 0.7, totalContributors: 5, topContributors: [] },
          diversity: { score: 70, geographicDiversity: 0.6, contributorCount: 5, uniqueLocations: [], retentionRate: 0.7 },
          responseTime: { score: 70, averageResponseTime: 48 * 60 * 60 * 1000, medianResponseTime: 36 * 60 * 60 * 1000, p25ResponseTime: 12 * 60 * 60 * 1000, p75ResponseTime: 72 * 60 * 60 * 1000, p95ResponseTime: 96 * 60 * 60 * 1000 },
          activity: { score: 80, commitFrequency: 20, issueResolutionRate: 0.8, prMergeRate: 0.85, lastActivity: new Date().toISOString() },
          sustainability: { score: 70, starGrowthRate: 0.15, contributorGrowthRate: 0.1, issueClosureRate: 0.7, forkCount: 3, lastUpdated: new Date().toISOString() }
        },
        repository: {
          name: 'json-test',
          full_name: 'owner/json-test',
          description: 'JSON test repository',
          stargazers_count: 50,
          forks_count: 3,
          open_issues_count: 5,
          language: 'JavaScript',
          created_at: new Date('2024-01-01T00:00:00Z').toISOString()
        }
      };

      mockHealthAnalyzer.calculateOverallHealthScore.mockResolvedValue(mockHealthScore);
      mockDashboardReporter.generateJSONReport.mockReturnValue(JSON.stringify(mockHealthScore, null, 2));

      process.argv = ['node', 'index.js', 'check', 'owner/json-test', '--format', 'json'];

      await new Promise((resolve) => {
        program.parseAsync(['node', 'index.js', 'check', 'owner/json-test', '--format', 'json']).then(resolve);
      });

      expect(mockDashboardReporter.generateJSONReport).toHaveBeenCalledWith(mockHealthScore);
    });

    it('should support demo mode', async () => {
      process.argv = ['node', 'index.js', 'check', 'owner/test-repo', '--demo', '--format', 'terminal'];

      // Mock demo data generation
      const mockDemoScore = {
        overallScore: 70,
        metrics: {
          busFactor: { score: 75, riskLevel: 'medium', busFactor: 0.6, totalContributors: 8, topContributors: [] },
          diversity: { score: 65, geographicDiversity: 0.5, contributorCount: 8, uniqueLocations: [], retentionRate: 0.7 },
          responseTime: { score: 70, averageResponseTime: 48 * 60 * 60 * 1000, medianResponseTime: 36 * 60 * 60 * 1000, p25ResponseTime: 12 * 60 * 60 * 1000, p75ResponseTime: 72 * 60 * 60 * 1000, p95ResponseTime: 96 * 60 * 60 * 1000 },
          activity: { score: 75, commitFrequency: 15, issueResolutionRate: 0.75, prMergeRate: 0.8, lastActivity: new Date().toISOString() },
          sustainability: { score: 65, starGrowthRate: 0.12, contributorGrowthRate: 0.08, issueClosureRate: 0.7, forkCount: 2, lastUpdated: new Date().toISOString() }
        },
        repository: {
          name: 'demo-repo',
          full_name: 'owner/demo-repo',
          description: 'Demo repository',
          stargazers_count: 75,
          forks_count: 2,
          open_issues_count: 8,
          language: 'Python',
          created_at: new Date('2024-01-01T00:00:00Z').toISOString()
        }
      };

      mockHealthAnalyzer.calculateOverallHealthScore.mockResolvedValue(mockDemoScore);
      mockDashboardReporter.generateReport.mockReturnValue('Demo terminal report');

      await new Promise((resolve) => {
        program.parseAsync(['node', 'index.js', 'check', 'owner/test-repo', '--demo', '--format', 'terminal']).then(resolve);
      });

      expect(mockHealthAnalyzer.calculateOverallHealthScore).toHaveBeenCalledWith('owner/test-repo');
    });
  });

  describe('demo command', () => {
    it('should run demo successfully', async () => {
      process.argv = ['node', 'index.js', 'demo', '--format', 'compact'];

      const mockDemoScore = {
        overallScore: 80,
        metrics: {
          busFactor: { score: 85, riskLevel: 'low', busFactor: 0.8, totalContributors: 12, topContributors: [] },
          diversity: { score: 75, geographicDiversity: 0.7, contributorCount: 12, uniqueLocations: [], retentionRate: 0.8 },
          responseTime: { score: 80, averageResponseTime: 24 * 60 * 60 * 1000, medianResponseTime: 18 * 60 * 60 * 1000, p25ResponseTime: 6 * 60 * 60 * 1000, p75ResponseTime: 36 * 60 * 60 * 1000, p95ResponseTime: 48 * 60 * 60 * 1000 },
          activity: { score: 85, commitFrequency: 30, issueResolutionRate: 0.85, prMergeRate: 0.9, lastActivity: new Date().toISOString() },
          sustainability: { score: 75, starGrowthRate: 0.18, contributorGrowthRate: 0.12, issueClosureRate: 0.8, forkCount: 4, lastUpdated: new Date().toISOString() }
        },
        repository: {
          name: 'demo-project',
          full_name: 'owner/demo-project',
          description: 'Demo project with realistic metrics',
          stargazers_count: 150,
          forks_count: 4,
          open_issues_count: 6,
          language: 'Go',
          created_at: new Date('2024-01-01T00:00:00Z').toISOString()
        }
      };

      mockDashboardReporter.generateCompactReport.mockReturnValue('Compact demo report');

      await new Promise((resolve) => {
        program.parseAsync(['node', 'index.js', 'demo', '--format', 'compact']).then(resolve);
      });

      expect(mockDashboardReporter.generateCompactReport).toHaveBeenCalledWith(mockDemoScore);
    });
  });

  describe('config command', () => {
    it('should show current configuration', async () => {
      process.argv = ['node', 'index.js', 'config', '--show'];

      mockConfigManager.getConfig.mockReturnValue({
        busFactor: { threshold: 0.8 },
        responseTime: { good: 24 * 60 * 60 * 1000 },
        healthWeights: { busFactor: 0.3, diversity: 0.2 }
      });

      await new Promise((resolve) => {
        program.parseAsync(['node', 'index.js', 'config', '--show']).then(resolve);
      });

      expect(mockConfigManager.getConfig).toHaveBeenCalled();
    });

    it('should initialize default configuration', async () => {
      process.argv = ['node', 'index.js', 'config', '--init'];

      await new Promise((resolve) => {
        program.parseAsync(['node', 'index.js', 'config', '--init']).then(resolve);
      });

      expect(mockConfigManager.resetToDefaults).toHaveBeenCalled();
    });

    it('should update configuration', async () => {
      process.argv = ['node', 'index.js', 'config', '--update', 'busFactor.threshold=0.9'];

      mockConfigManager.getConfig.mockReturnValue({
        busFactor: { threshold: 0.8 },
        responseTime: { good: 24 * 60 * 60 * 1000 },
        healthWeights: { busFactor: 0.3, diversity: 0.2 }
      });

      await new Promise((resolve) => {
        program.parseAsync(['node', 'index.js', 'config', '--update', 'busFactor.threshold=0.9']).then(resolve);
      });

      expect(mockConfigManager.updateConfig).toHaveBeenCalledWith({
        busFactor: { threshold: 0.9 }
      });
    });

    it('should reset configuration to defaults', async () => {
      process.argv = ['node', 'index.js', 'config', '--reset'];

      await new Promise((resolve) => {
        program.parseAsync(['node', 'index.js', 'config', '--reset']).then(resolve);
      });

      expect(mockConfigManager.resetToDefaults).toHaveBeenCalled();
    });
  });

  // Helper functions (simulating CLI actions)
  async function analyzeRepository(repo: string, options: any) {
    if (options.demo) {
      // Demo mode logic
      const mockScore = getMockScore(repo);
      const report = mockDashboardReporter.generateReport(mockScore, options.format);
      console.log(report);
    } else {
      // Real analysis logic
      const score = await mockHealthAnalyzer.calculateOverallHealthScore(repo);
      const report = mockDashboardReporter.generateReport(score, options.format);
      console.log(report);
    }
  }

  async function runDemo(options: any) {
    const mockScore = getMockScore('demo-repo');
    let report;
    
    switch (options.format) {
      case 'json':
        report = mockDashboardReporter.generateJSONReport(mockScore);
        break;
      case 'compact':
        report = mockDashboardReporter.generateCompactReport(mockScore);
        break;
      default:
        report = mockDashboardReporter.generateReport(mockScore, 'terminal');
    }
    
    console.log(report);
  }

  async function manageConfig(options: any) {
    if (options.show) {
      const config = mockConfigManager.getConfig();
      console.log(JSON.stringify(config, null, 2));
    } else if (options.init) {
      mockConfigManager.resetToDefaults();
      console.log('Configuration initialized with defaults');
    } else if (options.update) {
      const [key, value] = options.update.split('=');
      mockConfigManager.updateConfig({ [key]: JSON.parse(value) });
      console.log(`Configuration updated: ${key} = ${value}`);
    } else if (options.reset) {
      mockConfigManager.resetToDefaults();
      console.log('Configuration reset to defaults');
    }
  }

  function getMockScore(repo: string) {
    return {
      overallScore: 75 + Math.floor(Math.random() * 20),
      metrics: {
        busFactor: { score: 70 + Math.floor(Math.random() * 30), riskLevel: 'medium', busFactor: 0.5 + Math.random() * 0.4, totalContributors: 5 + Math.floor(Math.random() * 10), topContributors: [] },
        diversity: { score: 65 + Math.floor(Math.random() * 30), geographicDiversity: 0.4 + Math.random() * 0.4, contributorCount: 5 + Math.floor(Math.random() * 10), uniqueLocations: [], retentionRate: 0.6 + Math.random() * 0.3 },
        responseTime: { score: 70 + Math.floor(Math.random() * 30), averageResponseTime: 24 * 60 * 60 * 1000 * (1 + Math.random()), medianResponseTime: 18 * 60 * 60 * 1000 * (1 + Math.random()), p25ResponseTime: 6 * 60 * 60 * 1000 * (1 + Math.random()), p75ResponseTime: 36 * 60 * 60 * 1000 * (1 + Math.random()), p95ResponseTime: 48 * 60 * 60 * 1000 * (1 + Math.random()) },
        activity: { score: 80 + Math.floor(Math.random() * 20), commitFrequency: 10 + Math.floor(Math.random() * 20), issueResolutionRate: 0.7 + Math.random() * 0.25, prMergeRate: 0.8 + Math.random() * 0.2, lastActivity: new Date().toISOString() },
        sustainability: { score: 65 + Math.floor(Math.random() * 30), starGrowthRate: 0.1 + Math.random() * 0.2, contributorGrowthRate: 0.05 + Math.random() * 0.15, issueClosureRate: 0.6 + Math.random() * 0.3, forkCount: 1 + Math.floor(Math.random() * 5), lastUpdated: new Date().toISOString() }
      },
      repository: {
        name: repo,
        full_name: `owner/${repo}`,
        description: `Mock repository for ${repo}`,
        stargazers_count: 50 + Math.floor(Math.random() * 150),
        forks_count: 1 + Math.floor(Math.random() * 10),
        open_issues_count: 5 + Math.floor(Math.random() * 20),
        language: ['JavaScript', 'TypeScript', 'Python', 'Go', 'Rust'][Math.floor(Math.random() * 5)],
        created_at: new Date('2024-01-01T00:00:00Z').toISOString()
      }
    };
  }
});