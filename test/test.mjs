#!/usr/bin/env node
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { ConfigManager } = require('../dist/config-manager.js');
const { HealthAnalyzer } = require('../dist/health-analyzer.js');

function makeMockData(overrides = {}) {
  return {
    repository: {
      name: 'test-repo', fullName: 'user/test-repo', description: 'A test repo',
      language: 'TypeScript', stars: 5000, forks: 200, openIssues: 30,
      createdAt: '2023-01-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z',
      license: 'MIT', topics: ['test', 'demo'],
      ...overrides.repository
    },
    issues: overrides.issues || [
      { id: 1, number: 1, title: 'Bug', body: '', state: 'open', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z', closedAt: '', labels: [], author: 'alice', assignees: [], comments: 2 },
      { id: 2, number: 2, title: 'Feature', body: '', state: 'closed', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-02T12:00:00Z', closedAt: '2026-01-03T00:00:00Z', labels: [], author: 'bob', assignees: [], comments: 3 }
    ],
    pullRequests: overrides.pullRequests || [
      { id: 1, number: 1, title: 'Fix bug', body: '', state: 'closed', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z', closedAt: '2026-01-03T00:00:00Z', author: 'alice', reviewers: [], comments: 1, additions: 50, deletions: 10, files: 3, labels: [] },
      { id: 2, number: 2, title: 'New feature', body: '', state: 'open', createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-02-02T00:00:00Z', closedAt: '', author: 'bob', reviewers: [], comments: 0, additions: 200, deletions: 5, files: 5, labels: [] }
    ],
    contributors: overrides.contributors || [
      { login: 'alice', name: 'Alice', contributions: 100, firstContribution: '2024-01-01T00:00:00Z', lastContribution: '2026-05-01T00:00:00Z', commits: 80, prs: 15, issues: 5 },
      { login: 'bob', name: 'Bob', contributions: 50, firstContribution: '2025-06-01T00:00:00Z', lastContribution: '2026-05-15T00:00:00Z', commits: 40, prs: 8, issues: 2 },
      { login: 'charlie', name: 'Charlie', contributions: 20, firstContribution: '2026-04-01T00:00:00Z', lastContribution: '2026-05-20T00:00:00Z', commits: 15, prs: 3, issues: 2 }
    ],
    commits: overrides.commits || [
      { sha: 'a1', message: 'init', author: 'alice', date: '2026-01-01T00:00:00Z', additions: 100, deletions: 0, files: 5 },
      { sha: 'a2', message: 'fix', author: 'alice', date: '2026-02-01T00:00:00Z', additions: 20, deletions: 5, files: 2 },
      { sha: 'b1', message: 'feature', author: 'bob', date: '2026-03-01T00:00:00Z', additions: 200, deletions: 10, files: 8 },
      { sha: 'c1', message: 'docs', author: 'charlie', date: '2026-04-01T00:00:00Z', additions: 30, deletions: 0, files: 1 }
    ]
  };
}

describe('ConfigManager', () => {
  it('returns default config when no file exists', () => {
    const cm = new ConfigManager();
    const config = cm.getConfig();
    assert.equal(config.defaultDepth, 6);
    assert.equal(config.outputFormat, 'table');
    assert.ok(config.databasePath);
  });

  it('gets GitHub token from config or env', () => {
    const cm = new ConfigManager();
    assert.ok(typeof cm.getGitHubToken() === 'string');
  });

  it('saves and updates config', async () => {
    const cm = new ConfigManager();
    cm.updateConfig({ defaultDepth: 12 });
    assert.equal(cm.getConfig().defaultDepth, 12);
    const fs = await import('fs');
    const path = await import('path');
    const cp = path.join(process.cwd(), 'oss-health-config.json');
    if (fs.existsSync(cp)) fs.unlinkSync(cp);
  });

  it('sets GitHub token', async () => {
    const cm = new ConfigManager();
    cm.setGitHubToken('test-token-123');
    assert.equal(cm.getGitHubToken(), 'test-token-123');
    const fs = await import('fs');
    const path = await import('path');
    const cp = path.join(process.cwd(), 'oss-health-config.json');
    if (fs.existsSync(cp)) fs.unlinkSync(cp);
  });
});

describe('HealthAnalyzer - Bus Factor', () => {
  it('calculates bus factor with distributed contributors', async () => {
    const analyzer = new HealthAnalyzer(6);
    const result = await analyzer.analyze(makeMockData());
    assert.ok(result.metrics.busFactor.score >= 0);
    assert.ok(result.metrics.busFactor.score <= 100);
    assert.ok(['low', 'medium', 'high'].includes(result.metrics.busFactor.riskLevel));
    assert.ok(result.metrics.busFactor.distribution);
  });

  it('detects high risk when one person does most work', async () => {
    const analyzer = new HealthAnalyzer(6);
    const commits = Array.from({ length: 10 }, (_, i) => ({
      sha: String(i), message: `c${i}`, author: 'alice', date: '2026-01-01T00:00:00Z', additions: 10, deletions: 0, files: 1
    }));
    commits.push({ sha: 'x', message: 'b', author: 'bob', date: '2026-01-01T00:00:00Z', additions: 10, deletions: 0, files: 1 });
    const result = await analyzer.analyze(makeMockData({ commits }));
    assert.equal(result.metrics.busFactor.riskLevel, 'high');
  });

  it('shows low risk with even distribution', async () => {
    const analyzer = new HealthAnalyzer(6);
    const commits = [
      { sha: '1', message: 'a', author: 'alice', date: '2026-01-01T00:00:00Z', additions: 10, deletions: 0, files: 1 },
      { sha: '2', message: 'b', author: 'bob', date: '2026-01-02T00:00:00Z', additions: 10, deletions: 0, files: 1 },
      { sha: '3', message: 'c', author: 'charlie', date: '2026-01-03T00:00:00Z', additions: 10, deletions: 0, files: 1 },
      { sha: '4', message: 'd', author: 'alice', date: '2026-01-04T00:00:00Z', additions: 10, deletions: 0, files: 1 },
      { sha: '5', message: 'e', author: 'bob', date: '2026-01-05T00:00:00Z', additions: 10, deletions: 0, files: 1 },
      { sha: '6', message: 'f', author: 'charlie', date: '2026-01-06T00:00:00Z', additions: 10, deletions: 0, files: 1 },
    ];
    const result = await analyzer.analyze(makeMockData({ commits }));
    assert.ok(['low', 'medium'].includes(result.metrics.busFactor.riskLevel));
  });
});

describe('HealthAnalyzer - Activity', () => {
  it('calculates activity velocities', async () => {
    const analyzer = new HealthAnalyzer(6);
    const result = await analyzer.analyze(makeMockData());
    assert.ok(result.metrics.activity.commitVelocity > 0);
    assert.ok(result.metrics.activity.prVelocity > 0);
    assert.ok(result.metrics.activity.issueVelocity > 0);
    assert.ok(['increasing', 'stable', 'decreasing'].includes(result.metrics.activity.contributorTrend));
  });

  it('detects increasing contributor trend', async () => {
    const analyzer = new HealthAnalyzer(6);
    const recent = new Date(); recent.setMonth(recent.getMonth() - 1);
    const contributors = [
      { login: 'a', name: 'A', contributions: 50, firstContribution: '2024-01-01T00:00:00Z', lastContribution: recent.toISOString(), commits: 40, prs: 5, issues: 5 },
      { login: 'b', name: 'B', contributions: 40, firstContribution: '2024-06-01T00:00:00Z', lastContribution: recent.toISOString(), commits: 30, prs: 5, issues: 5 },
      { login: 'c', name: 'C', contributions: 30, firstContribution: '2025-01-01T00:00:00Z', lastContribution: recent.toISOString(), commits: 20, prs: 5, issues: 5 },
    ];
    const result = await analyzer.analyze(makeMockData({ contributors }));
    assert.equal(result.metrics.activity.contributorTrend, 'increasing');
  });
});

describe('HealthAnalyzer - Response Time', () => {
  it('calculates response times from closed issues', async () => {
    const analyzer = new HealthAnalyzer(6);
    const issues = [
      { id: 1, number: 1, title: 'Bug', body: '', state: 'closed', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T12:00:00Z', closedAt: '2026-01-02T00:00:00Z', labels: [], author: 'alice', assignees: [], comments: 1 },
      { id: 2, number: 2, title: 'Bug2', body: '', state: 'closed', createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-02-01T06:00:00Z', closedAt: '2026-02-02T00:00:00Z', labels: [], author: 'bob', assignees: [], comments: 2 },
    ];
    const result = await analyzer.analyze(makeMockData({ issues }));
    assert.ok(result.metrics.responseTime.averageResponseTime > 0);
    assert.ok(result.metrics.responseTime.issueResponseTime > 0);
  });

  it('handles zero closed issues gracefully', async () => {
    const analyzer = new HealthAnalyzer(6);
    const issues = [
      { id: 1, number: 1, title: 'Open', body: '', state: 'open', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z', closedAt: '', labels: [], author: 'alice', assignees: [], comments: 0 }
    ];
    const pullRequests = [
      { id: 1, number: 1, title: 'PR', body: '', state: 'open', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z', closedAt: '', author: 'alice', reviewers: [], comments: 0, additions: 10, deletions: 0, files: 1, labels: [] }
    ];
    const result = await analyzer.analyze(makeMockData({ issues, pullRequests }));
    assert.equal(result.metrics.responseTime.averageResponseTime, 0);
    assert.equal(result.metrics.responseTime.averageResolutionTime, 0);
  });
});

describe('HealthAnalyzer - Security', () => {
  it('gives good score for popular repo with license', async () => {
    const analyzer = new HealthAnalyzer(6);
    const result = await analyzer.analyze(makeMockData({
      repository: { name: 'test', fullName: 'user/test', description: '', language: 'TS', stars: 5000, forks: 200, openIssues: 30, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z', license: 'MIT', topics: [] }
    }));
    assert.equal(result.metrics.security.licenseCompliance, true);
    assert.equal(result.metrics.security.dependencyHealth, 'good');
    assert.ok(result.metrics.security.score > 50);
  });

  it('flags no license and low stars', async () => {
    const analyzer = new HealthAnalyzer(6);
    const result = await analyzer.analyze(makeMockData({
      repository: { name: 'test', fullName: 'user/test', description: '', language: 'JS', stars: 50, forks: 5, openIssues: 10, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z', license: 'No license', topics: [] }
    }));
    assert.equal(result.metrics.security.licenseCompliance, false);
    assert.equal(result.metrics.security.dependencyHealth, 'critical');
  });
});

describe('HealthAnalyzer - Sustainability & Diversity', () => {
  it('calculates sustainability metrics', async () => {
    const analyzer = new HealthAnalyzer(6);
    const result = await analyzer.analyze(makeMockData());
    assert.ok(result.metrics.sustainability.prMergeRate >= 0);
    assert.ok(result.metrics.sustainability.prMergeRate <= 1);
    assert.ok(result.metrics.sustainability.issueBacklog >= 0);
    assert.ok(result.metrics.sustainability.maintenanceIndex >= 0);
  });

  it('calculates diversity metrics', async () => {
    const analyzer = new HealthAnalyzer(6);
    const result = await analyzer.analyze(makeMockData());
    assert.ok(result.metrics.diversity.newContributorsRatio >= 0);
    assert.ok(result.metrics.diversity.retentionRate >= 0);
    assert.ok(result.metrics.diversity.geographicDistribution);
  });
});

describe('HealthAnalyzer - Overall', () => {
  it('produces valid overall score and metadata', async () => {
    const analyzer = new HealthAnalyzer(6);
    const result = await analyzer.analyze(makeMockData());
    assert.ok(result.metrics.overallScore >= 0);
    assert.ok(result.metrics.overallScore <= 100);
    assert.ok(result.analysisDate);
    assert.equal(result.analysisDepth, 6);
    assert.equal(result.repository.name, 'test-repo');
  });

  it('generates insights and recommendations', async () => {
    const analyzer = new HealthAnalyzer(6);
    const result = await analyzer.analyze(makeMockData());
    assert.ok(Array.isArray(result.insights));
    assert.ok(Array.isArray(result.recommendations));
  });
});
