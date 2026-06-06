import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardReporter } from './dashboard-reporter';
import { HealthScore, BusFactorResult, DiversityResult, ResponseTimeResult } from './types';

// Mock chalk
vi.mock('chalk');
const { default: chalk } = await import('chalk');

describe('DashboardReporter', () => {
  let reporter: DashboardReporter;

  beforeEach(() => {
    reporter = new DashboardReporter();
  });

  describe('generateReport', () => {
    it('should generate comprehensive health report', () => {
      const mockHealthScore: HealthScore = {
        overallScore: 85,
        metrics: {
          busFactor: {
            score: 90,
            riskLevel: 'low',
            busFactor: 0.75,
            totalContributors: 10,
            topContributors: [
              { login: 'user1', contributions: 150 },
              { login: 'user2', contributions: 120 },
              { login: 'user3', contributions: 100 },
            ]
          },
          diversity: {
            score: 80,
            geographicDiversity: 0.7,
            contributorCount: 10,
            uniqueLocations: ['USA', 'UK', 'Japan', 'Germany'],
            retentionRate: 0.8
          },
          responseTime: {
            score: 75,
            averageResponseTime: 36 * 60 * 60 * 1000, // 36 hours
            medianResponseTime: 24 * 60 * 60 * 1000, // 24 hours
            p25ResponseTime: 12 * 60 * 60 * 1000, // 12 hours
            p75ResponseTime: 48 * 60 * 60 * 1000, // 48 hours
            p95ResponseTime: 72 * 60 * 60 * 1000, // 72 hours
          },
          activity: {
            score: 90,
            commitFrequency: 25,
            issueResolutionRate: 0.85,
            prMergeRate: 0.9,
            lastActivity: new Date().toISOString()
          },
          sustainability: {
            score: 80,
            starGrowthRate: 0.2,
            contributorGrowthRate: 0.15,
            issueClosureRate: 0.8,
            forkCount: 5,
            lastUpdated: new Date().toISOString()
          }
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

      // Mock chalk colors
      vi.mocked(chalk).mockImplementation({
        green: (text: string) => `🟢 ${text}`,
        red: (text: string) => `🔴 ${text}`,
        yellow: (text: string) => `🟡 ${text}`,
        blue: (text: string) => `🔵 ${text}`,
        magenta: (text: string) => `🟣 ${text}`,
        cyan: (text: string) => `🔷 ${text}`,
        bold: (text: string) => `**${text}**`,
        dim: (text: string) => `*${text}*`,
        reset: (text: string) => text,
      });

      const report = reporter.generateReport(mockHealthScore, 'terminal');

      expect(report).toContain('📊 OSS Project Health Dashboard');
      expect(report).toContain('owner/test-repo');
      expect(report).toContain('85/100');
      expect(report).toContain('Bus Factor: 90/100');
      expect(report).toContain('Diversity: 80/100');
      expect(report).toContain('Response Time: 75/100');
      expect(report).toContain('Activity: 90/100');
      expect(report).toContain('Sustainability: 80/100');
      expect(report).toContain('🟢 Low Risk');
    });
  });

  describe('generateJSONReport', () => {
    it('should generate JSON report', () => {
      const mockHealthScore: HealthScore = {
        overallScore: 75,
        metrics: {
          busFactor: {
            score: 80,
            riskLevel: 'medium',
            busFactor: 0.7,
            totalContributors: 5,
            topContributors: []
          },
          diversity: {
            score: 70,
            geographicDiversity: 0.6,
            contributorCount: 5,
            uniqueLocations: ['USA'],
            retentionRate: 0.7
          },
          responseTime: {
            score: 70,
            averageResponseTime: 48 * 60 * 60 * 1000,
            medianResponseTime: 36 * 60 * 60 * 1000,
            p25ResponseTime: 12 * 60 * 60 * 1000,
            p75ResponseTime: 72 * 60 * 60 * 1000,
            p95ResponseTime: 96 * 60 * 60 * 1000,
          },
          activity: {
            score: 80,
            commitFrequency: 20,
            issueResolutionRate: 0.8,
            prMergeRate: 0.85,
            lastActivity: new Date().toISOString()
          },
          sustainability: {
            score: 70,
            starGrowthRate: 0.15,
            contributorGrowthRate: 0.1,
            issueClosureRate: 0.7,
            forkCount: 3,
            lastUpdated: new Date().toISOString()
          }
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

      const report = reporter.generateJSONReport(mockHealthScore);

      expect(report).toBeDefined();
      expect(typeof report).toBe('string');
      
      // Parse and verify JSON structure
      const parsed = JSON.parse(report);
      expect(parsed).toHaveProperty('repository');
      expect(parsed).toHaveProperty('overallScore');
      expect(parsed).toHaveProperty('metrics');
      expect(parsed.metrics).toHaveProperty('busFactor');
      expect(parsed.metrics).toHaveProperty('diversity');
      expect(parsed.metrics).toHaveProperty('responseTime');
      expect(parsed.metrics).toHaveProperty('activity');
      expect(parsed.metrics).toHaveProperty('sustainability');
    });
  });

  describe('generateCompactReport', () => {
    it('should generate compact terminal report', () => {
      const mockHealthScore: HealthScore = {
        overallScore: 90,
        metrics: {
          busFactor: { score: 95, riskLevel: 'low', busFactor: 0.8, totalContributors: 15, topContributors: [] },
          diversity: { score: 85, geographicDiversity: 0.8, contributorCount: 15, uniqueLocations: [], retentionRate: 0.9 },
          responseTime: { score: 90, averageResponseTime: 12 * 60 * 60 * 1000, medianResponseTime: 8 * 60 * 60 * 1000, p25ResponseTime: 4 * 60 * 60 * 1000, p75ResponseTime: 16 * 60 * 60 * 1000, p95ResponseTime: 24 * 60 * 60 * 1000 },
          activity: { score: 95, commitFrequency: 50, issueResolutionRate: 0.95, prMergeRate: 0.98, lastActivity: new Date().toISOString() },
          sustainability: { score: 85, starGrowthRate: 0.25, contributorGrowthRate: 0.2, issueClosureRate: 0.9, forkCount: 10, lastUpdated: new Date().toISOString() }
        },
        repository: {
          name: 'compact-test',
          full_name: 'owner/compact-test',
          description: 'Compact test repository',
          stargazers_count: 200,
          forks_count: 10,
          open_issues_count: 5,
          language: 'Go',
          created_at: new Date('2024-01-01T00:00:00Z').toISOString()
        }
      };

      const report = reporter.generateCompactReport(mockHealthScore);

      expect(report).toContain('owner/compact-test');
      expect(report).toContain('90/100');
      expect(report).toContain('Bus Factor: 95/100 (Low Risk)');
      expect(report).toContain('Diversity: 85/100');
      expect(report).toContain('🟢 Excellent');
    });
  });

  describe('generateDetailedReport', () => {
    it('should generate detailed analysis report', () => {
      const mockHealthScore: HealthScore = {
        overallScore: 65,
        metrics: {
          busFactor: { score: 60, riskLevel: 'high', busFactor: 0.4, totalContributors: 3, topContributors: [
            { login: 'user1', contributions: 200 },
            { login: 'user2', contributions: 100 },
            { login: 'user3', contributions: 50 },
          ] },
          diversity: { score: 70, geographicDiversity: 0.5, contributorCount: 3, uniqueLocations: ['USA'], retentionRate: 0.6 },
          responseTime: { score: 60, averageResponseTime: 96 * 60 * 60 * 1000, medianResponseTime: 72 * 60 * 60 * 1000, p25ResponseTime: 48 * 60 * 60 * 1000, p75ResponseTime: 120 * 60 * 60 * 1000, p95ResponseTime: 168 * 60 * 60 * 1000 },
          activity: { score: 70, commitFrequency: 10, issueResolutionRate: 0.7, prMergeRate: 0.75, lastActivity: new Date().toISOString() },
          sustainability: { score: 60, starGrowthRate: 0.1, contributorGrowthRate: 0.05, issueClosureRate: 0.6, forkCount: 2, lastUpdated: new Date().toISOString() }
        },
        repository: {
          name: 'detailed-test',
          full_name: 'owner/detailed-test',
          description: 'Detailed test repository',
          stargazers_count: 25,
          forks_count: 2,
          open_issues_count: 8,
          language: 'Python',
          created_at: new Date('2024-01-01T00:00:00Z').toISOString()
        }
      };

      const report = reporter.generateDetailedReport(mockHealthScore);

      expect(report).toContain('🔍 Detailed Analysis');
      expect(report).toContain('⚠️ Bus Factor Risk: HIGH');
      expect(report).toContain('⏱️ Average Response Time: 96 hours');
      expect(report).toContain('📈 Commit Frequency: 10 commits/month');
      expect(report).toContain('🔄 Issue Resolution Rate: 70%');
      expect(report).toContain('🔀 PR Merge Rate: 75%');
      expect(report).toContain('⭐ Star Growth Rate: 10%/month');
      expect(report).toContain('👥 Contributor Growth Rate: 5%/month');
      expect(report).toContain('🏗️ Recommendations');
    });
  });

  describe('generateRiskAssessment', () => {
    it('should generate risk assessment for different scenarios', () => {
      // Low risk scenario
      const lowRiskScore: HealthScore = {
        overallScore: 90,
        metrics: {
          busFactor: { score: 95, riskLevel: 'low', busFactor: 0.8, totalContributors: 10, topContributors: [] },
          diversity: { score: 85, geographicDiversity: 0.8, contributorCount: 10, uniqueLocations: [], retentionRate: 0.9 },
          responseTime: { score: 90, averageResponseTime: 12 * 60 * 60 * 1000, medianResponseTime: 8 * 60 * 60 * 1000, p25ResponseTime: 4 * 60 * 60 * 1000, p75ResponseTime: 16 * 60 * 60 * 1000, p95ResponseTime: 24 * 60 * 60 * 1000 },
          activity: { score: 95, commitFrequency: 50, issueResolutionRate: 0.95, prMergeRate: 0.98, lastActivity: new Date().toISOString() },
          sustainability: { score: 85, starGrowthRate: 0.25, contributorGrowthRate: 0.2, issueClosureRate: 0.9, forkCount: 10, lastUpdated: new Date().toISOString() }
        },
        repository: {
          name: 'low-risk',
          full_name: 'owner/low-risk',
          description: 'Low risk repository',
          stargazers_count: 100,
          forks_count: 5,
          open_issues_count: 3,
          language: 'TypeScript',
          created_at: new Date('2024-01-01T00:00:00Z').toISOString()
        }
      };

      // High risk scenario
      const highRiskScore: HealthScore = {
        overallScore: 40,
        metrics: {
          busFactor: { score: 30, riskLevel: 'high', busFactor: 0.2, totalContributors: 1, topContributors: [] },
          diversity: { score: 40, geographicDiversity: 0.2, contributorCount: 1, uniqueLocations: [], retentionRate: 0.3 },
          responseTime: { score: 50, averageResponseTime: 336 * 60 * 60 * 1000, medianResponseTime: 288 * 60 * 60 * 1000, p25ResponseTime: 192 * 60 * 60 * 1000, p75ResponseTime: 384 * 60 * 60 * 1000, p95ResponseTime: 504 * 60 * 60 * 1000 },
          activity: { score: 30, commitFrequency: 2, issueResolutionRate: 0.3, prMergeRate: 0.4, lastActivity: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
          sustainability: { score: 50, starGrowthRate: 0.02, contributorGrowthRate: 0.01, issueClosureRate: 0.4, forkCount: 1, lastUpdated: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() }
        },
        repository: {
          name: 'high-risk',
          full_name: 'owner/high-risk',
          description: 'High risk repository',
          stargazers_count: 5,
          forks_count: 0,
          open_issues_count: 15,
          language: 'C++',
          created_at: new Date('2024-01-01T00:00:00Z').toISOString()
        }
      };

      const lowRiskReport = reporter.generateRiskAssessment(lowRiskScore);
      const highRiskReport = reporter.generateRiskAssessment(highRiskScore);

      expect(lowRiskReport).toContain('🟢 Low Risk');
      expect(lowRiskReport).toContain('Stable and healthy project');
      expect(highRiskReport).toContain('🔴 High Risk');
      expect(highRiskReport).toContain('Critical attention required');
    });
  });

  describe('color coding', () => {
    it('should apply appropriate colors to scores', () => {
      const testScores = [
        { score: 95, expectedColor: 'green' },
        { score: 80, expectedColor: 'green' },
        { score: 65, expectedColor: 'yellow' },
        { score: 45, expectedColor: 'red' },
        { score: 25, expectedColor: 'red' },
      ];

      testScores.forEach(({ score, expectedColor }) => {
        // Reset mock
        vi.mocked(chalk).mockImplementation({
          green: (text: string) => `🟢${text}`,
          red: (text: string) => `🔴${text}`,
          yellow: (text: string) => `🟡${text}`,
          blue: (text: string) => `🔵${text}`,
          magenta: (text: string) => `🟣${text}`,
          cyan: (text: string) => `🔷${text}`,
          bold: (text: string) => `**${text}**`,
          dim: (text: string) => `*${text}*`,
          reset: (text: string) => text,
        });

        const healthScore: HealthScore = {
          overallScore: score,
          metrics: {
            busFactor: { score, riskLevel: 'low', busFactor: 0.5, totalContributors: 5, topContributors: [] },
            diversity: { score, geographicDiversity: 0.5, contributorCount: 5, uniqueLocations: [], retentionRate: 0.5 },
            responseTime: { score, averageResponseTime: 24 * 60 * 60 * 1000, medianResponseTime: 24 * 60 * 60 * 1000, p25ResponseTime: 24 * 60 * 60 * 1000, p75ResponseTime: 24 * 60 * 60 * 1000, p95ResponseTime: 24 * 60 * 60 * 1000 },
            activity: { score, commitFrequency: 10, issueResolutionRate: 0.5, prMergeRate: 0.5, lastActivity: new Date().toISOString() },
            sustainability: { score, starGrowthRate: 0.1, contributorGrowthRate: 0.1, issueClosureRate: 0.5, forkCount: 1, lastUpdated: new Date().toISOString() }
          },
          repository: {
            name: 'color-test',
            full_name: 'owner/color-test',
            description: 'Color test repository',
            stargazers_count: 50,
            forks_count: 2,
            open_issues_count: 5,
            language: 'JavaScript',
            created_at: new Date('2024-01-01T00:00:00Z').toISOString()
          }
        };

        const report = reporter.generateCompactReport(healthScore);
        
        if (expectedColor === 'green') {
          expect(report).toContain('🟢');
        } else if (expectedColor === 'yellow') {
          expect(report).toContain('🟡');
        } else if (expectedColor === 'red') {
          expect(report).toContain('🔴');
        }
      });
    });
  });
});