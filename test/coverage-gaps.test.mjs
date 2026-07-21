#!/usr/bin/env node
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'module';
import * as fs from 'fs';
import * as path from 'path';

const require = createRequire(import.meta.url);
const { ConfigManager } = require('../dist/config-manager.js');
const { HealthAnalyzer } = require('../dist/health-analyzer.js');

// ─── Helpers ───────────────────────────────────────────

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

const CONFIG_PATH = path.join(process.cwd(), 'oss-health-config.json');

function cleanupConfig() {
  if (fs.existsSync(CONFIG_PATH)) fs.unlinkSync(CONFIG_PATH);
}

// ─── ConfigManager: catch blocks ───────────────────────

describe('ConfigManager - Coverage Gaps', () => {
  before(() => cleanupConfig());
  after(() => cleanupConfig());

  it('falls back to defaults when config file has invalid JSON', () => {
    // Write a corrupt config file to trigger the catch block
    fs.writeFileSync(CONFIG_PATH, '{ invalid json !!! ');
    const cm = new ConfigManager();
    const config = cm.getConfig();
    // Should fall back to defaults
    assert.equal(config.defaultDepth, 6);
    assert.equal(config.outputFormat, 'table');
  });

  it('handles saveConfig error gracefully', () => {
    // Create ConfigManager with an unwritable path to trigger catch block.
    // We set configPath to a directory path (not a file) so writeFileSync fails.
    const cm = new ConfigManager();
    // Override configPath to a directory (which can't be written as a file)
    cm.configPath = process.cwd(); // cwd is a directory — writeFileSync will throw
    // Should not throw — catches error internally
    cm.saveConfig();
    assert.ok(true, 'saveConfig caught the error without throwing');
  });
});

// ─── HealthAnalyzer: branch coverage gaps ──────────────

describe('HealthAnalyzer - Bus Factor Coverage Gaps', () => {
  it('marks multiple contributors as critical when they cumulatively reach 70%', async () => {
    const analyzer = new HealthAnalyzer(6);
    // 10 commits: alice 4, bob 3, charlie 3 → alice (40%) + bob (70%) both ≤ 70%
    const commits = [
      ...Array.from({ length: 4 }, (_, i) => ({ sha: `a${i}`, message: 'a', author: 'alice', date: '2026-01-01T00:00:00Z', additions: 10, deletions: 0, files: 1 })),
      ...Array.from({ length: 3 }, (_, i) => ({ sha: `b${i}`, message: 'b', author: 'bob', date: '2026-01-01T00:00:00Z', additions: 10, deletions: 0, files: 1 })),
      ...Array.from({ length: 3 }, (_, i) => ({ sha: `c${i}`, message: 'c', author: 'charlie', date: '2026-01-01T00:00:00Z', additions: 10, deletions: 0, files: 1 })),
    ];
    const result = await analyzer.analyze(makeMockData({ commits }));
    // Multiple critical contributors
    assert.ok(result.metrics.busFactor.criticalContributors.length >= 2,
      `Expected >=2 critical contributors, got ${result.metrics.busFactor.criticalContributors.length}`);
  });

  it('returns low risk level when max contribution ratio is below 0.3', async () => {
    const analyzer = new HealthAnalyzer(6);
    // 10 commits split evenly across 4 people → max ratio = 3/10 = 0.3, not > 0.3
    const commits = [
      ...Array.from({ length: 3 }, (_, i) => ({ sha: `a${i}`, message: 'a', author: 'alice', date: '2026-01-01T00:00:00Z', additions: 5, deletions: 0, files: 1 })),
      ...Array.from({ length: 3 }, (_, i) => ({ sha: `b${i}`, message: 'b', author: 'bob', date: '2026-01-02T00:00:00Z', additions: 5, deletions: 0, files: 1 })),
      ...Array.from({ length: 2 }, (_, i) => ({ sha: `c${i}`, message: 'c', author: 'charlie', date: '2026-01-03T00:00:00Z', additions: 5, deletions: 0, files: 1 })),
      ...Array.from({ length: 2 }, (_, i) => ({ sha: `d${i}`, message: 'd', author: 'dave', date: '2026-01-04T00:00:00Z', additions: 5, deletions: 0, files: 1 })),
    ];
    const result = await analyzer.analyze(makeMockData({
      commits,
      contributors: [
        { login: 'alice', name: 'A', contributions: 3, firstContribution: '2024-01-01T00:00:00Z', lastContribution: '2026-05-01T00:00:00Z', commits: 3, prs: 0, issues: 0 },
        { login: 'bob', name: 'B', contributions: 3, firstContribution: '2024-01-01T00:00:00Z', lastContribution: '2026-05-01T00:00:00Z', commits: 3, prs: 0, issues: 0 },
        { login: 'charlie', name: 'C', contributions: 2, firstContribution: '2024-01-01T00:00:00Z', lastContribution: '2026-05-01T00:00:00Z', commits: 2, prs: 0, issues: 0 },
        { login: 'dave', name: 'D', contributions: 2, firstContribution: '2024-01-01T00:00:00Z', lastContribution: '2026-05-01T00:00:00Z', commits: 2, prs: 0, issues: 0 },
      ]
    }));
    assert.equal(result.metrics.busFactor.riskLevel, 'low',
      `Expected low risk, got ${result.metrics.busFactor.riskLevel} (maxRatio should be 0.3)`);
  });
});

describe('HealthAnalyzer - Activity Coverage Gaps', () => {
  it('detects stable contributor trend (30-70% recent)', async () => {
    const analyzer = new HealthAnalyzer(6);
    // 5 contributors, 2 recent (< 2 months) → 40% → stable
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const fourMonthsAgo = new Date();
    fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);

    const contributors = [
      { login: 'a', name: 'A', contributions: 50, firstContribution: '2023-01-01T00:00:00Z', lastContribution: new Date().toISOString(), commits: 40, prs: 5, issues: 5 },
      { login: 'b', name: 'B', contributions: 40, firstContribution: '2023-01-01T00:00:00Z', lastContribution: new Date().toISOString(), commits: 30, prs: 5, issues: 5 },
      { login: 'c', name: 'C', contributions: 30, firstContribution: '2023-01-01T00:00:00Z', lastContribution: fourMonthsAgo.toISOString(), commits: 20, prs: 5, issues: 5 },
      { login: 'd', name: 'D', contributions: 20, firstContribution: '2023-01-01T00:00:00Z', lastContribution: fourMonthsAgo.toISOString(), commits: 15, prs: 3, issues: 2 },
      { login: 'e', name: 'E', contributions: 10, firstContribution: '2023-01-01T00:00:00Z', lastContribution: fourMonthsAgo.toISOString(), commits: 8, prs: 1, issues: 1 },
    ];
    const result = await analyzer.analyze(makeMockData({ contributors }));
    assert.equal(result.metrics.activity.contributorTrend, 'stable',
      `Expected stable, got ${result.metrics.activity.contributorTrend}`);
  });
});

describe('HealthAnalyzer - Security Coverage Gaps', () => {
  it('gives warning dependency health for mid-range stars (100-1000)', async () => {
    const analyzer = new HealthAnalyzer(6);
    const result = await analyzer.analyze(makeMockData({
      repository: {
        name: 'mid', fullName: 'user/mid', description: '', language: 'JS',
        stars: 500, forks: 20, openIssues: 5,
        createdAt: '2023-01-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z',
        license: 'MIT', topics: []
      }
    }));
    assert.equal(result.metrics.security.dependencyHealth, 'warning');
  });
});

// ─── Insights & Recommendations Branch Coverage ────────

describe('HealthAnalyzer - Insights Branch Coverage', () => {
  it('generates "slow response" insight when responseTime score < 60', async () => {
    const analyzer = new HealthAnalyzer(6);
    // Craft data that gives low response time score
    // Score = max(0, 100 - (avgResponseHours / 24) * 10)
    // Need avgResponseTime > 24*4 = 96 hours for score < 60
    const issues = [
      { id: 1, number: 1, title: 'Bug', body: '', state: 'closed', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-10T00:00:00Z', closedAt: '2025-01-15T00:00:00Z', labels: [], author: 'a', assignees: [], comments: 1 },
      { id: 2, number: 2, title: 'Bug2', body: '', state: 'closed', createdAt: '2025-02-01T00:00:00Z', updatedAt: '2025-02-10T00:00:00Z', closedAt: '2025-02-15T00:00:00Z', labels: [], author: 'b', assignees: [], comments: 1 },
    ];
    const result = await analyzer.analyze(makeMockData({ issues }));
    // Response time = 9 days * 24 = 216 hours → score = max(0, 100 - 90) = 10
    assert.ok(result.metrics.responseTime.score < 60,
      `Expected response score < 60, got ${result.metrics.responseTime.score}`);
    assert.ok(result.insights.some(i => i.includes('Slow response')),
      `Expected slow response insight, got: ${result.insights.join('; ')}`);
  });

  it('generates "high activity" insight when activity score > 80', async () => {
    const analyzer = new HealthAnalyzer(6);
    // High activity: lots of commits/PRs/issues per month
    const commits = Array.from({ length: 300 }, (_, i) => ({
      sha: `s${i}`, message: `c${i}`, author: 'alice', date: '2026-01-01T00:00:00Z', additions: 5, deletions: 0, files: 1
    }));
    const pullRequests = Array.from({ length: 120 }, (_, i) => ({
      id: i, number: i, title: `PR ${i}`, body: '', state: 'closed',
      createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z', closedAt: '2026-01-03T00:00:00Z',
      author: 'alice', reviewers: [], comments: 1, additions: 10, deletions: 5, files: 2, labels: []
    }));
    const issues = Array.from({ length: 120 }, (_, i) => ({
      id: i, number: i, title: `Issue ${i}`, body: '', state: 'open',
      createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z', closedAt: '',
      labels: [], author: 'alice', assignees: [], comments: 0
    }));
    const result = await analyzer.analyze(makeMockData({ commits, pullRequests, issues }));
    assert.ok(result.metrics.activity.score > 80,
      `Expected activity score > 80, got ${result.metrics.activity.score}`);
    assert.ok(result.insights.some(i => i.includes('High activity')),
      `Expected high activity insight, got: ${result.insights.join('; ')}`);
  });

  it('generates "sustainability concerns" insight when sustainability score < 70', async () => {
    const analyzer = new HealthAnalyzer(6);
    // Low sustainability: lots of open issues, few merged PRs, low retention
    const issues = Array.from({ length: 50 }, (_, i) => ({
      id: i, number: i, title: `Issue ${i}`, body: '', state: 'open',
      createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z', closedAt: '',
      labels: [], author: 'alice', assignees: [], comments: 0
    }));
    const pullRequests = [
      { id: 1, number: 1, title: 'Only PR', body: '', state: 'closed', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z', closedAt: '2026-01-03T00:00:00Z', author: 'alice', reviewers: [], comments: 0, additions: 5, deletions: 0, files: 1, labels: [] },
    ];
    const contributors = [
      { login: 'alice', name: 'Alice', contributions: 3, firstContribution: '2024-01-01T00:00:00Z', lastContribution: '2026-05-01T00:00:00Z', commits: 2, prs: 1, issues: 0 },
    ];
    const result = await analyzer.analyze(makeMockData({ issues, pullRequests, contributors }));
    assert.ok(result.metrics.sustainability.score < 70,
      `Expected sustainability score < 70, got ${result.metrics.sustainability.score}`);
    assert.ok(result.insights.some(i => i.includes('Sustainability')),
      `Expected sustainability insight, got: ${result.insights.join('; ')}`);
  });
});

describe('HealthAnalyzer - Recommendations Branch Coverage', () => {
  it('generates bus factor recommendations for high risk', async () => {
    const analyzer = new HealthAnalyzer(6);
    // One person does >50% → high risk
    const commits = Array.from({ length: 10 }, (_, i) => ({
      sha: String(i), message: `c${i}`, author: 'alice', date: '2026-01-01T00:00:00Z', additions: 10, deletions: 0, files: 1
    }));
    commits.push({ sha: 'x', message: 'b', author: 'bob', date: '2026-01-01T00:00:00Z', additions: 5, deletions: 0, files: 1 });
    const result = await analyzer.analyze(makeMockData({ commits }));
    assert.equal(result.metrics.busFactor.riskLevel, 'high');
    assert.ok(result.recommendations.some(r => r.includes('onboarding')),
      `Expected onboarding recommendation`);
    assert.ok(result.recommendations.some(r => r.includes('Document')),
      `Expected documentation recommendation`);
  });

  it('generates diversity recommendations when diversity score < 70', async () => {
    const analyzer = new HealthAnalyzer(6);
    // All old contributors → newContributorsRatio = 0, high retention
    // score = (0*40) + (1*40) + 20 = 60 → < 70
    const contributors = [
      { login: 'a', name: 'A', contributions: 100, firstContribution: '2020-01-01T00:00:00Z', lastContribution: '2026-05-01T00:00:00Z', commits: 80, prs: 10, issues: 5 },
      { login: 'b', name: 'B', contributions: 50, firstContribution: '2020-01-01T00:00:00Z', lastContribution: '2026-05-01T00:00:00Z', commits: 40, prs: 5, issues: 2 },
    ];
    const result = await analyzer.analyze(makeMockData({ contributors }));
    assert.ok(result.metrics.diversity.score < 70,
      `Expected diversity score < 70, got ${result.metrics.diversity.score}`);
    assert.ok(result.recommendations.some(r => r.includes('diversity')),
      `Expected diversity recommendation`);
  });

  it('generates response time recommendations when average response > 48 hours', async () => {
    const analyzer = new HealthAnalyzer(6);
    // Create issues with response time > 48 hours
    const issues = [
      { id: 1, number: 1, title: 'Bug', body: '', state: 'closed', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-05T00:00:00Z', closedAt: '2025-01-06T00:00:00Z', labels: [], author: 'a', assignees: [], comments: 1 },
      { id: 2, number: 2, title: 'Bug2', body: '', state: 'closed', createdAt: '2025-02-01T00:00:00Z', updatedAt: '2025-02-05T00:00:00Z', closedAt: '2025-02-06T00:00:00Z', labels: [], author: 'b', assignees: [], comments: 1 },
    ];
    const result = await analyzer.analyze(makeMockData({ issues }));
    assert.ok(result.metrics.responseTime.averageResponseTime > 48,
      `Expected avg response > 48h, got ${result.metrics.responseTime.averageResponseTime}`);
    assert.ok(result.recommendations.some(r => r.includes('SLA')),
      `Expected SLA recommendation`);
  });

  it('generates issue backlog recommendations when issueBacklog > 50', async () => {
    const analyzer = new HealthAnalyzer(6);
    // 60 open issues → issueBacklog = 60
    const issues = Array.from({ length: 60 }, (_, i) => ({
      id: i, number: i, title: `Issue ${i}`, body: '', state: 'open',
      createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z', closedAt: '',
      labels: [], author: 'alice', assignees: [], comments: 0
    }));
    const result = await analyzer.analyze(makeMockData({ issues }));
    assert.ok(result.metrics.sustainability.issueBacklog > 50,
      `Expected issueBacklog > 50, got ${result.metrics.sustainability.issueBacklog}`);
    assert.ok(result.recommendations.some(r => r.includes('backlog')),
      `Expected backlog recommendation`);
  });

  it('generates security recommendations when dependency health is critical', async () => {
    const analyzer = new HealthAnalyzer(6);
    const result = await analyzer.analyze(makeMockData({
      repository: {
        name: 'small', fullName: 'user/small', description: '', language: 'JS',
        stars: 50, forks: 5, openIssues: 3,
        createdAt: '2023-01-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z',
        license: 'MIT', topics: []
      }
    }));
    assert.equal(result.metrics.security.dependencyHealth, 'critical');
    assert.ok(result.recommendations.some(r => r.includes('vulnerability')),
      `Expected vulnerability scanning recommendation`);
  });
});

// ─── Edge Case Coverage Tests ──────────────────────────

describe('HealthAnalyzer - Edge Cases', () => {
  it('handles empty contributors (bus factor || 0 fallback)', async () => {
    const analyzer = new HealthAnalyzer(6);
    const result = await analyzer.analyze({
      repository: {
        name: 'test', fullName: 'user/test', description: '', language: 'JS',
        stars: 100, forks: 1, openIssues: 0,
        createdAt: '2023-01-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z',
        license: 'MIT', topics: []
      },
      issues: [],
      pullRequests: [],
      contributors: [],
      commits: []
    });
    assert.equal(result.metrics.busFactor.criticalContributors.length, 0);
    assert.ok(result.metrics.busFactor.score >= 0);
  });

  it('handles zero stars (security issueToStarRatio fallback)', async () => {
    const analyzer = new HealthAnalyzer(6);
    const result = await analyzer.analyze({
      repository: {
        name: 'nostars', fullName: 'user/nostars', description: '', language: 'JS',
        stars: 0, forks: 0, openIssues: 5,
        createdAt: '2023-01-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z',
        license: 'MIT', topics: []
      },
      issues: [],
      pullRequests: [],
      contributors: [],
      commits: []
    });
    assert.ok(result.metrics.security.score >= 0);
  });

  it('saveToDatabase completes without error (no-op)', async () => {
    const analyzer = new HealthAnalyzer(6);
    const healthData = {
      repository: { name: 'test', fullName: 'user/test' },
      analysisDate: new Date().toISOString(),
      analysisDepth: 6,
      metrics: {},
      insights: [],
      recommendations: []
    };
    await analyzer.saveToDatabase(healthData); // should not throw
    assert.ok(true);
  });
});
