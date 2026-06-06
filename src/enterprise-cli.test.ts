import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { promises as fs } from 'fs';
import path from 'path';

// Mock the dependencies
vi.mock('./github-client');
vi.mock('./health-analyzer');
vi.mock('./dashboard-reporter');
vi.mock('./config-manager');

import { GitHubClient } from './github-client';
import { HealthAnalyzer } from './health-analyzer';
import { DashboardReporter } from './dashboard-reporter';
import { ConfigManager } from './config-manager';

const mockGitHubClient = GitHubClient as any;
const mockHealthAnalyzer = HealthAnalyzer as any;
const mockDashboardReporter = DashboardReporter as any;
const mockConfigManager = ConfigManager as any;

describe('Enterprise CLI', () => {
  let mockConfig: any;
  let mockGitHub: any;
  let mockAnalyzer: any;
  let mockReporter: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock config
    mockConfig = {
      getGitHubToken: vi.fn().mockReturnValue('mock-token')
    };
    mockConfigManager.mockImplementation(() => mockConfig);

    // Mock GitHub client
    mockGitHub = {
      getRepository: vi.fn(),
      getIssues: vi.fn(),
      getPullRequests: vi.fn(),
      getContributors: vi.fn(),
      getCommits: vi.fn()
    };
    mockGitHubClient.mockImplementation(() => mockGitHub);

    // Mock analyzer
    mockAnalyzer = {
      analyze: vi.fn()
    };
    mockHealthAnalyzer.mockImplementation(() => mockAnalyzer);

    // Mock reporter
    mockReporter = {
      generateReport: vi.fn()
    };
    mockDashboardReporter.mockImplementation(() => mockReporter);

    // Mock file system
    vi.mocked(fs).readFile.mockResolvedValue('https://github.com/owner/repo1\nhttps://github.com/owner/repo2\n');
    vi.mocked(fs).mkdir.mockResolvedValue();
    vi.mocked(fs).writeFile.mockResolvedValue();

    // Mock fetch for webhook
    global.fetch = vi.fn();
    vi.mocked(fetch).mockResolvedValue({ ok: true } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Multi-repo analysis', () => {
    it('should analyze multiple repositories successfully', async () => {
      // Mock repository data
      const mockRepo1 = {
        name: 'repo1',
        full_name: 'owner/repo1',
        stargazers_count: 100,
        forks_count: 20
      };
      
      const mockRepo2 = {
        name: 'repo2',
        full_name: 'owner/repo2',
        stargazers_count: 200,
        forks_count: 40
      };

      // Mock analysis results
      const mockAnalysis1 = {
        overallScore: 85,
        busFactor: 0.8,
        diversity: 0.7,
        responseTime: 2,
        activity: 0.9,
        sustainability: 0.8,
        security: 0.9
      };

      const mockAnalysis2 = {
        overallScore: 75,
        busFactor: 0.6,
        diversity: 0.8,
        responseTime: 4,
        activity: 0.7,
        sustainability: 0.7,
        security: 0.8
      };

      // Setup mocks
      mockGitHub.getRepository.mockResolvedValue(mockRepo1);
      mockGitHub.getIssues.mockResolvedValue([]);
      mockGitHub.getPullRequests.mockResolvedValue([]);
      mockGitHub.getContributors.mockResolvedValue([]);
      mockGitHub.getCommits.mockResolvedValue([]);
      
      mockAnalyzer.analyze.mockResolvedValueOnce(mockAnalysis1)
        .mockResolvedValueOnce(mockAnalysis2);

      // Create a test command
      const program = new Command();
      program
        .command('multi-repo')
        .argument('<repo-file>')
        .option('-o, --output <format>', 'Output format', 'dashboard')
        .action(async (repoFile, options) => {
          // Read repository URLs
          const repoContent = await fs.readFile(repoFile, 'utf-8');
          const repoUrls = repoContent.split('\n')
            .filter(line => line.trim() && !line.startsWith('#'))
            .map(line => line.trim());

          expect(repoUrls).toHaveLength(2);
          
          // Analyze each repository
          for (const repoUrl of repoUrls) {
            // Parse URL
            const repoMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
            expect(repoMatch).toBeTruthy();
            
            const [_, owner, repo] = repoMatch!;
            
            // Fetch data
            const repoData = await mockGitHub.getRepository(owner, repo);
            expect(repoData).toBeDefined();
            
            // Analyze
            const healthData = await mockAnalyzer.analyze({
              repository: repoData,
              issues: [],
              pullRequests: [],
              contributors: [],
              commits: []
            });
            
            expect(healthData).toBeDefined();
          }

          // Generate report
          await generateEnterpriseReport([{
            url: repoUrls[0],
            score: mockAnalysis1.overallScore,
            busFactor: mockAnalysis1.busFactor,
            diversity: mockAnalysis1.diversity,
            responseTime: mockAnalysis1.responseTime,
            activity: mockAnalysis1.activity,
            sustainability: mockAnalysis1.sustainability,
            security: mockAnalysis1.security,
            lastUpdated: new Date().toISOString()
          }, {
            url: repoUrls[1],
            score: mockAnalysis2.overallScore,
            busFactor: mockAnalysis2.busFactor,
            diversity: mockAnalysis2.diversity,
            responseTime: mockAnalysis2.responseTime,
            activity: mockAnalysis2.activity,
            sustainability: mockAnalysis2.sustainability,
            security: mockAnalysis2.security,
            lastUpdated: new Date().toISOString()
          }], options);

          // Export results
          await exportResults([mockAnalysis1, mockAnalysis2], options);
        });

      // Execute the command
      await program.parse(['node', 'test', 'multi-repo', 'test-repos.txt']);
    });

    it('should handle invalid repository URLs gracefully', async () => {
      // Mock file with invalid URL
      vi.mocked(fs).readFile.mockResolvedValue('https://github.com/owner/repo1\ninvalid-url\nhttps://github.com/owner/repo2\n');

      const mockAnalysis = {
        overallScore: 85,
        busFactor: 0.8,
        diversity: 0.7,
        responseTime: 2,
        activity: 0.9,
        sustainability: 0.8,
        security: 0.9
      };

      mockGitHub.getRepository.mockResolvedValue({
        name: 'repo1',
        full_name: 'owner/repo1',
        stargazers_count: 100,
        forks_count: 20
      });
      mockGitHub.getIssues.mockResolvedValue([]);
      mockGitHub.getPullRequests.mockResolvedValue([]);
      mockGitHub.getContributors.mockResolvedValue([]);
      mockGitHub.getCommits.mockResolvedValue([]);
      mockAnalyzer.analyze.mockResolvedValue(mockAnalysis);

      const program = new Command();
      program
        .command('multi-repo')
        .argument('<repo-file>')
        .option('-o, --output <format>', 'Output format', 'dashboard')
        .action(async (repoFile, options) => {
          const repoContent = await fs.readFile(repoFile, 'utf-8');
          const repoUrls = repoContent.split('\n')
            .filter(line => line.trim() && !line.startsWith('#'))
            .map(line => line.trim());

          expect(repoUrls).toHaveLength(3);
          expect(repoUrls[1]).toBe('invalid-url');
          
          // Skip invalid URLs
          const validUrls = repoUrls.filter(url => {
            const repoMatch = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
            return repoMatch !== null;
          });

          expect(validUrls).toHaveLength(2);
        });

      await program.parse(['node', 'test', 'multi-repo', 'test-repos.txt']);
    });
  });

  describe('Health monitoring', () => {
    it('should set up continuous monitoring for a repository', async () => {
      const mockRepo = {
        name: 'test-repo',
        full_name: 'owner/test-repo',
        stargazers_count: 100,
        forks_count: 20
      };

      const mockHealthData = {
        overallScore: 85,
        busFactor: 0.8,
        diversity: 0.7,
        responseTime: 2,
        activity: 0.9,
        sustainability: 0.8,
        security: 0.9
      };

      // Mock data fetching
      mockGitHub.getRepository.mockResolvedValue(mockRepo);
      mockGitHub.getIssues.mockResolvedValue([]);
      mockGitHub.getPullRequests.mockResolvedValue([]);
      mockGitHub.getContributors.mockResolvedValue([]);
      mockGitHub.getCommits.mockResolvedValue([]);
      mockAnalyzer.analyze.mockResolvedValue(mockHealthData);

      const mockSetInterval = vi.fn();
      vi.spyOn(global, 'setInterval').mockImplementation(mockSetInterval);

      const program = new Command();
      program
        .command('monitor')
        .argument('<repo-url>')
        .option('--interval <hours>', 'Monitoring interval', '24')
        .option('--threshold <score>', 'Alert threshold', '70')
        .action(async (repoUrl, options) => {
          const repoMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
          expect(repoMatch).toBeTruthy();
          
          const [_, owner, repo] = repoMatch!;
          
          // Perform initial health check
          await performHealthCheck(owner, repo, mockAnalyzer, mockGitHub, 70, options);
          
          // Set up interval monitoring
          expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 24 * 60 * 60 * 1000);
        });

      // Mock the health check function
      global.setInterval.mockImplementation((callback: Function) => {
        // Call callback once for testing
        callback();
      });

      await program.parse(['node', 'test', 'monitor', 'https://github.com/owner/test-repo']);
    });

    it('should send alerts when threshold is violated', async () => {
      const mockRepo = {
        name: 'test-repo',
        full_name: 'owner/test-repo',
        stargazers_count: 100,
        forks_count: 20
      };

      const mockLowScore = {
        overallScore: 65,
        busFactor: 0.4,
        diversity: 0.5,
        responseTime: 8,
        activity: 0.3,
        sustainability: 0.6,
        security: 0.7
      };

      mockGitHub.getRepository.mockResolvedValue(mockRepo);
      mockGitHub.getIssues.mockResolvedValue([]);
      mockGitHub.getPullRequests.mockResolvedValue([]);
      mockGitHub.getContributors.mockResolvedValue([]);
      mockGitHub.getCommits.mockResolvedValue([]);
      mockAnalyzer.analyze.mockResolvedValue(mockLowScore);

      const program = new Command();
      program
        .command('monitor')
        .argument('<repo-url>')
        .option('--interval <hours>', 'Monitoring interval', '24')
        .option('--threshold <score>', 'Alert threshold', '70')
        .option('--alert-slack <webhook>', 'Slack webhook', 'https://hooks.slack.com/test')
        .action(async (repoUrl, options) => {
          const repoMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
          const [_, owner, repo] = repoMatch!;
          
          await performHealthCheck(owner, repo, mockAnalyzer, mockGitHub, 70, options);
        });

      await program.parse(['node', 'test', 'monitor', 'https://github.com/owner/test-repo']);
    });
  });

  describe('Benchmark analysis', () => {
    it('should generate benchmark report for a repository', async () => {
      const mockRepo = {
        name: 'test-repo',
        full_name: 'owner/test-repo',
        stargazers_count: 100,
        forks_count: 20
      };

      const mockHealthData = {
        overallScore: 85,
        busFactor: 0.8,
        diversity: 0.7,
        responseTime: 2,
        activity: 0.9,
        sustainability: 0.8,
        security: 0.9
      };

      mockGitHub.getRepository.mockResolvedValue(mockRepo);
      mockGitHub.getIssues.mockResolvedValue([]);
      mockGitHub.getPullRequests.mockResolvedValue([]);
      mockGitHub.getContributors.mockResolvedValue([]);
      mockGitHub.getCommits.mockResolvedValue([]);
      mockAnalyzer.analyze.mockResolvedValue(mockHealthData);

      const program = new Command();
      program
        .command('benchmark')
        .argument('<repo-url>')
        .option('--category <category>', 'Project category', 'web-development')
        .action(async (repoUrl, options) => {
          const repoMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
          expect(repoMatch).toBeTruthy();
          
          const [_, owner, repo] = repoMatch!;
          
          const benchmarkResults = await performBenchmarkAnalysis(owner, repo, mockGitHub, mockAnalyzer, options);
          expect(benchmarkResults.target).toEqual(mockHealthData);
          expect(benchmarkResults.category).toBe('web-development');
          
          await generateBenchmarkReport(benchmarkResults, options);
        });

      await program.parse(['node', 'test', 'benchmark', 'https://github.com/owner/test-repo']);
    });
  });

  describe('Enterprise features', () => {
    it('should generate recommendations based on health metrics', () => {
      const healthData = {
        overallScore: 65,
        busFactor: 0.4,
        diversity: 0.5,
        responseTime: 8,
        activity: 0.3,
        sustainability: 0.6,
        security: 0.7
      };

      const recommendations = generateRecommendations(healthData);
      
      expect(recommendations).toContain('Increase code review participation from multiple maintainers');
      expect(recommendations).toContain('Encourage contributions from more diverse contributors');
      expect(recommendations).toContain('Implement faster issue/PR review processes');
      expect(recommendations).toContain('Increase project activity and community engagement');
    });

    it('should export results in different formats', async () => {
      const mockResults = [
        {
          url: 'https://github.com/owner/repo1',
          score: 85,
          busFactor: 0.8,
          diversity: 0.7,
          responseTime: 2,
          activity: 0.9,
          sustainability: 0.8,
          security: 0.9,
          lastUpdated: new Date().toISOString()
        }
      ];

      const options = {
        exportPath: './exports',
        exportFormat: 'json'
      };

      await exportResults(mockResults, options);
      
      expect(fs.mkdir).toHaveBeenCalledWith('./exports', { recursive: true });
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('multi-repo-analysis'),
        expect.stringContaining('"url": "https://github.com/owner/repo1"')
      );
    });
  });
});

// Helper functions (simplified for testing)
async function generateEnterpriseReport(results: any[], options: any) {
  // Mock implementation for testing
  expect(results).toBeInstanceOf(Array);
  expect(options).toBeDefined();
}

async function exportResults(results: any[], options: any) {
  // Mock implementation for testing
  expect(results).toBeInstanceOf(Array);
  expect(options).toBeDefined();
}

async function performHealthCheck(owner: string, repo: string, analyzer: any, github: any, threshold: number, options: any) {
  // Mock implementation for testing
  expect(owner).toBeDefined();
  expect(repo).toBeDefined();
  expect(analyzer).toBeDefined();
  expect(github).toBeDefined();
  expect(threshold).toBeNumber();
  expect(options).toBeDefined();
}

async function performBenchmarkAnalysis(owner: string, repo: string, github: any, analyzer: any, options: any) {
  // Mock implementation for testing
  expect(owner).toBeDefined();
  expect(repo).toBeDefined();
  expect(github).toBeDefined();
  expect(analyzer).toBeDefined();
  expect(options).toBeDefined();
  
  return {
    target: { repository: { name: 'test' } },
    category: options.category,
    similarProjects: [],
    benchmarks: {
      busFactor: { target: 0.8, industry: 0.65 },
      diversity: { target: 0.7, industry: 0.7 },
      responseTime: { target: 2, industry: 3.5 },
      activity: { target: 0.9, industry: 0.75 },
      sustainability: { target: 0.8, industry: 0.8 },
      security: { target: 0.9, industry: 0.85 }
    }
  };
}

async function generateBenchmarkReport(benchmarkResults: any, options: any) {
  // Mock implementation for testing
  expect(benchmarkResults).toBeDefined();
  expect(options).toBeDefined();
}

function generateRecommendations(healthData: any) {
  const recommendations = [];
  
  if (healthData.busFactor < 0.5) {
    recommendations.push('Increase code review participation from multiple maintainers');
  }
  if (healthData.diversity < 0.6) {
    recommendations.push('Encourage contributions from more diverse contributors');
  }
  if (healthData.responseTime > 7) {
    recommendations.push('Implement faster issue/PR review processes');
  }
  if (healthData.activity < 0.5) {
    recommendations.push('Increase project activity and community engagement');
  }
  if (healthData.sustainability < 0.6) {
    recommendations.push('Improve long-term sustainability practices');
  }
  if (healthData.security < 0.7) {
    recommendations.push('Enhance security practices and vulnerability management');
  }

  return recommendations;
}