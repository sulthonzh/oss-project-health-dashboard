import { describe, it, expect } from 'vitest';
import { DashboardReporter } from './dashboard-reporter';
import { HealthData } from './github-client';

function makeHealthData(overrides: Partial<any> = {}): HealthData {
  return {
    repository: {
      name: 'test-repo',
      fullName: 'owner/test-repo',
      description: 'A test repository',
      language: 'TypeScript',
      stars: 100,
      forks: 10,
      openIssues: 5,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2026-06-01T00:00:00Z',
      license: 'MIT',
      topics: ['cli', 'developer-tools'],
      ...overrides.repository
    },
    analysisDate: '2026-06-10T14:00:00Z',
    analysisDepth: 6,
    metrics: {
      overallScore: 82,
      busFactor: {
        score: 78,
        criticalContributors: ['alice', 'bob'],
        riskLevel: 'medium' as const,
        distribution: { alice: 50, bob: 30, charlie: 20 }
      },
      diversity: {
        score: 70,
        geographicDistribution: { 'US': 5, 'EU': 3 },
        timezoneDistribution: [{ timezone: 'UTC-5', count: 5 }],
        newContributorsRatio: 0.3,
        retentionRate: 0.75
      },
      responseTime: {
        score: 85,
        averageResponseTime: 12.5,
        averageResolutionTime: 48,
        issueResponseTime: 8.2,
        prResponseTime: 15.1
      },
      activity: {
        score: 90,
        commitVelocity: 25.3,
        prVelocity: 8.1,
        issueVelocity: 5.2,
        contributorTrend: 'increasing' as const
      },
      sustainability: {
        score: 75,
        contributorRetention: 0.8,
        issueBacklog: 12,
        prMergeRate: 0.85,
        maintenanceIndex: 7.2
      },
      security: {
        score: 88,
        vulnerabilityCount: 1,
        dependencyHealth: 'good' as const,
        licenseCompliance: true
      },
      ...overrides.metrics
    },
    insights: ['Strong commit velocity', 'Bus factor needs attention'],
    recommendations: ['Add more maintainers', 'Improve test coverage']
  } as any;
}

describe('DashboardReporter.toMarkdown', () => {
  const reporter = new DashboardReporter('markdown');

  it('generates markdown report with all sections', () => {
    const data = makeHealthData();
    const md = reporter.toMarkdown(data, {
      showBenchmark: false,
      showSecurity: true,
      showBusFactor: true
    });

    expect(md).toContain('# owner/test-repo — Health Report');
    expect(md).toContain('## Overall Score: 82/100');
    expect(md).toContain('## Metric Scores');
    expect(md).toContain('| Bus Factor | 78');
    expect(md).toContain('| Security | 88');
    expect(md).toContain('## Bus Factor');
    expect(md).toContain('**Risk Level:** medium');
    expect(md).toContain('| alice | 50 |');
    expect(md).toContain('## Repository');
    expect(md).toContain('| Stars | 100 |');
    expect(md).toContain('## Activity');
    expect(md).toContain('25.3 commits/month');
    expect(md).toContain('## Response Time');
    expect(md).toContain('12.5');
    expect(md).toContain('## Sustainability');
    expect(md).toContain('85.0%');
    expect(md).toContain('## Security');
    expect(md).toContain('| Vulnerabilities | 1 |');
    expect(md).toContain('## Insights');
    expect(md).toContain('- Strong commit velocity');
    expect(md).toContain('## Recommendations');
    expect(md).toContain('1. Add more maintainers');
  });

  it('omits security section when showSecurity is false', () => {
    const data = makeHealthData();
    const md = reporter.toMarkdown(data, {
      showBenchmark: false,
      showSecurity: false,
      showBusFactor: false
    });

    expect(md).not.toContain('## Security');
    expect(md).not.toContain('## Bus Factor');
  });

  it('omits insights and recommendations when empty', () => {
    const data = makeHealthData({});
    data.insights = [];
    data.recommendations = [];
    const md = reporter.toMarkdown(data, {
      showBenchmark: false,
      showSecurity: false,
      showBusFactor: false
    });

    expect(md).not.toContain('## Insights');
    expect(md).not.toContain('## Recommendations');
  });

  it('handles low scores with correct status emoji', () => {
    const data = makeHealthData({
      metrics: {
        overallScore: 35,
        busFactor: { score: 25, criticalContributors: ['alice'], riskLevel: 'high', distribution: { alice: 100 } },
        diversity: { score: 30, geographicDistribution: {}, timezoneDistribution: [], newContributorsRatio: 0, retentionRate: 0.2 },
        responseTime: { score: 40, averageResponseTime: 200, averageResolutionTime: 500, issueResponseTime: 150, prResponseTime: 250 },
        activity: { score: 35, commitVelocity: 1, prVelocity: 0.5, issueVelocity: 0.2, contributorTrend: 'decreasing' as const },
        sustainability: { score: 20, contributorRetention: 0.1, issueBacklog: 100, prMergeRate: 0.2, maintenanceIndex: 2 },
        security: { score: 30, vulnerabilityCount: 10, dependencyHealth: 'critical' as const, licenseCompliance: false }
      }
    });
    const md = reporter.toMarkdown(data, {
      showBenchmark: false,
      showSecurity: true,
      showBusFactor: true
    });

    expect(md).toContain('## Overall Score: 35/100 ❌');
    expect(md).toContain('| Bus Factor | 25 | ❌ |');
    expect(md).toContain('| Security | 30 | ❌ |');
    expect(md).toContain('License Compliance | ❌');
  });

  it('handles empty bus factor distribution', () => {
    const data = makeHealthData({
      metrics: {
        busFactor: { score: 95, criticalContributors: [], riskLevel: 'low', distribution: {} }
      }
    });
    const md = reporter.toMarkdown(data, {
      showBenchmark: false,
      showSecurity: false,
      showBusFactor: true
    });

    expect(md).toContain('**Risk Level:** low');
    expect(md).toContain('**Critical Contributors:** None');
    expect(md).not.toContain('| Contributor | Commits |');
  });
});
