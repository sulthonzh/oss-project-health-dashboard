#!/usr/bin/env node
import { describe, it, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'module';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const require = createRequire(import.meta.url);
const { ConfigManager } = require('../dist/config-manager.js');
const { HealthAnalyzer } = require('../dist/health-analyzer.js');

// Use a temp directory so ConfigManager's config file doesn't collide with other test files
const TMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ohd-cfg-'));
const CONFIG_PATH = path.join(TMP_DIR, 'oss-health-config.json');

function cleanupConfig() {
  if (fs.existsSync(CONFIG_PATH)) fs.unlinkSync(CONFIG_PATH);
}

before(() => {
  process.chdir(TMP_DIR);
  cleanupConfig();
});
after(() => {
  cleanupConfig();
  try { fs.rmdirSync(TMP_DIR); } catch {}
});

// ─── ConfigManager: getGitHubToken fallback chain (dist line 48) ───

describe('ConfigManager - getGitHubToken branch coverage', () => {
  beforeEach(() => cleanupConfig());
  afterEach(() => cleanupConfig());

  it('returns config.githubToken when set in config file', () => {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({ githubToken: 'ghp_config_token' }));
    const cm = new ConfigManager();
    assert.equal(cm.getGitHubToken(), 'ghp_config_token');
  });

  it('falls back to GITHUB_TOKEN env var when config has no token', () => {
    const oldEnv = process.env.GITHUB_TOKEN;
    process.env.GITHUB_TOKEN = 'ghp_env_token';
    const cm = new ConfigManager();
    assert.equal(cm.getGitHubToken(), 'ghp_env_token');
    if (oldEnv) process.env.GITHUB_TOKEN = oldEnv;
    else delete process.env.GITHUB_TOKEN;
  });

  it('returns empty string when neither config nor env has token', () => {
    delete process.env.GITHUB_TOKEN;
    const cm = new ConfigManager();
    assert.equal(cm.getGitHubToken(), '');
  });
});

// ─── ConfigManager: setGitHubToken (dist lines 52-53) ───

describe('ConfigManager - setGitHubToken branch coverage', () => {
  beforeEach(() => cleanupConfig());
  afterEach(() => cleanupConfig());

  it('sets token in config and persists to file', () => {
    const cm = new ConfigManager();
    cm.setGitHubToken('ghp_new_token');
    assert.equal(cm.getConfig().githubToken, 'ghp_new_token');
    const raw = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    assert.equal(raw.githubToken, 'ghp_new_token');
  });

  it('overwrites existing token', () => {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({ githubToken: 'old_token' }));
    const cm = new ConfigManager();
    assert.equal(cm.getGitHubToken(), 'old_token');
    cm.setGitHubToken('new_token');
    assert.equal(cm.getGitHubToken(), 'new_token');
    const raw = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    assert.equal(raw.githubToken, 'new_token');
  });
});

// ─── ConfigManager: updateConfig (dist line 87) ───

describe('ConfigManager - updateConfig branch coverage', () => {
  beforeEach(() => cleanupConfig());
  afterEach(() => cleanupConfig());

  it('merges partial updates into existing config', () => {
    const cm = new ConfigManager();
    assert.equal(cm.getConfig().defaultDepth, 6);
    cm.updateConfig({ defaultDepth: 12 });
    assert.equal(cm.getConfig().defaultDepth, 12);
    assert.equal(cm.getConfig().outputFormat, 'table');
  });

  it('persists updated config to file', () => {
    const cm = new ConfigManager();
    cm.updateConfig({ outputFormat: 'json' });
    const raw = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    assert.equal(raw.outputFormat, 'json');
  });

  it('updates multiple fields at once', () => {
    const cm = new ConfigManager();
    cm.updateConfig({ defaultDepth: 3, outputFormat: 'web', databasePath: '/tmp/test.db' });
    const config = cm.getConfig();
    assert.equal(config.defaultDepth, 3);
    assert.equal(config.outputFormat, 'web');
    assert.equal(config.databasePath, '/tmp/test.db');
  });

  it('preserves githubToken when updating other fields', () => {
    const cm = new ConfigManager();
    cm.setGitHubToken('ghp_preserve');
    cm.updateConfig({ defaultDepth: 10 });
    assert.equal(cm.getConfig().githubToken, 'ghp_preserve');
    assert.equal(cm.getConfig().defaultDepth, 10);
  });
});

// ─── ConfigManager: loadConfig with valid config file ───

describe('ConfigManager - loadConfig with valid file', () => {
  beforeEach(() => cleanupConfig());
  afterEach(() => cleanupConfig());

  it('loads custom config values from file', () => {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({
      githubToken: 'ghp_custom',
      defaultDepth: 8,
      outputFormat: 'json',
      databasePath: '/custom/path.db'
    }));
    const cm = new ConfigManager();
    const config = cm.getConfig();
    assert.equal(config.githubToken, 'ghp_custom');
    assert.equal(config.defaultDepth, 8);
    assert.equal(config.outputFormat, 'json');
    assert.equal(config.databasePath, '/custom/path.db');
  });
});

// ─── HealthAnalyzer: additional branch coverage ───

describe('HealthAnalyzer - additional branch coverage', () => {
  it('gives good dependency health for stars >= 1000', async () => {
    const analyzer = new HealthAnalyzer(6);
    const result = await analyzer.analyze({
      repository: {
        name: 'popular', fullName: 'user/popular', description: '', language: 'TS',
        stars: 5000, forks: 200, openIssues: 10,
        createdAt: '2023-01-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z',
        license: 'MIT', topics: []
      },
      issues: [],
      pullRequests: [],
      contributors: [],
      commits: []
    });
    assert.equal(result.metrics.security.dependencyHealth, 'good');
    assert.equal(result.metrics.security.licenseCompliance, true);
  });

  it('gives critical dependency health and no license when stars < 100', async () => {
    const analyzer = new HealthAnalyzer(6);
    const result = await analyzer.analyze({
      repository: {
        name: 'small', fullName: 'user/small', description: '', language: 'JS',
        stars: 50, forks: 1, openIssues: 2,
        createdAt: '2023-01-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z',
        license: 'No license', topics: []
      },
      issues: [],
      pullRequests: [],
      contributors: [],
      commits: []
    });
    assert.equal(result.metrics.security.dependencyHealth, 'critical');
    assert.equal(result.metrics.security.licenseCompliance, false);
  });

  it('generates low diversity insight when diversity score < 70', async () => {
    const analyzer = new HealthAnalyzer(6);
    const contributors = [
      { login: 'a', name: 'A', contributions: 100, firstContribution: '2019-01-01T00:00:00Z', lastContribution: '2026-05-01T00:00:00Z', commits: 80, prs: 10, issues: 5 },
      { login: 'b', name: 'B', contributions: 50, firstContribution: '2019-01-01T00:00:00Z', lastContribution: '2026-05-01T00:00:00Z', commits: 40, prs: 5, issues: 2 },
    ];
    const result = await analyzer.analyze({
      repository: {
        name: 'test', fullName: 'user/test', description: '', language: 'JS',
        stars: 500, forks: 10, openIssues: 5,
        createdAt: '2023-01-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z',
        license: 'MIT', topics: []
      },
      issues: [],
      pullRequests: [],
      contributors,
      commits: [
        { sha: '1', message: 'init', author: 'a', date: '2026-01-01T00:00:00Z', additions: 10, deletions: 0, files: 1 },
        { sha: '2', message: 'fix', author: 'b', date: '2026-02-01T00:00:00Z', additions: 5, deletions: 1, files: 1 },
      ]
    });
    assert.ok(result.metrics.diversity.score < 70);
    assert.ok(result.insights.some(i => i.includes('diversity')) || result.insights.some(i => i.includes('Low contributor diversity')),
      `Expected diversity insight, got: ${result.insights.join('; ')}`);
  });

  it('generates bus factor insight when bus factor score < 60', async () => {
    const analyzer = new HealthAnalyzer(6);
    const commits = [
      ...Array.from({ length: 6 }, (_, i) => ({ sha: `a${i}`, message: 'a', author: 'alice', date: '2026-01-01T00:00:00Z', additions: 5, deletions: 0, files: 1 })),
      ...Array.from({ length: 4 }, (_, i) => ({ sha: `b${i}`, message: 'b', author: 'bob', date: '2026-01-01T00:00:00Z', additions: 5, deletions: 0, files: 1 })),
    ];
    const result = await analyzer.analyze({
      repository: {
        name: 'test', fullName: 'user/test', description: '', language: 'JS',
        stars: 500, forks: 10, openIssues: 5,
        createdAt: '2023-01-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z',
        license: 'MIT', topics: []
      },
      issues: [],
      pullRequests: [],
      contributors: [
        { login: 'alice', name: 'Alice', contributions: 6, firstContribution: '2024-01-01T00:00:00Z', lastContribution: '2026-05-01T00:00:00Z', commits: 6, prs: 0, issues: 0 },
        { login: 'bob', name: 'Bob', contributions: 4, firstContribution: '2024-01-01T00:00:00Z', lastContribution: '2026-05-01T00:00:00Z', commits: 4, prs: 0, issues: 0 },
      ],
      commits
    });
    assert.ok(result.metrics.busFactor.score < 60,
      `Expected bus factor score < 60, got ${result.metrics.busFactor.score}`);
    assert.ok(result.insights.some(i => i.includes('bus factor')),
      `Expected bus factor insight, got: ${result.insights.join('; ')}`);
  });

  it('does not generate bus factor recommendations for low risk', async () => {
    const analyzer = new HealthAnalyzer(6);
    const commits = [
      ...Array.from({ length: 3 }, (_, i) => ({ sha: `a${i}`, message: 'a', author: 'alice', date: '2026-01-01T00:00:00Z', additions: 5, deletions: 0, files: 1 })),
      ...Array.from({ length: 3 }, (_, i) => ({ sha: `b${i}`, message: 'b', author: 'bob', date: '2026-01-01T00:00:00Z', additions: 5, deletions: 0, files: 1 })),
      ...Array.from({ length: 2 }, (_, i) => ({ sha: `c${i}`, message: 'c', author: 'charlie', date: '2026-01-01T00:00:00Z', additions: 5, deletions: 0, files: 1 })),
      ...Array.from({ length: 2 }, (_, i) => ({ sha: `d${i}`, message: 'd', author: 'dave', date: '2026-01-01T00:00:00Z', additions: 5, deletions: 0, files: 1 })),
    ];
    const contributors = [
      { login: 'alice', name: 'A', contributions: 3, firstContribution: '2024-01-01T00:00:00Z', lastContribution: '2026-05-01T00:00:00Z', commits: 3, prs: 0, issues: 0 },
      { login: 'bob', name: 'B', contributions: 3, firstContribution: '2024-01-01T00:00:00Z', lastContribution: '2026-05-01T00:00:00Z', commits: 3, prs: 0, issues: 0 },
      { login: 'charlie', name: 'C', contributions: 2, firstContribution: '2024-01-01T00:00:00Z', lastContribution: '2026-05-01T00:00:00Z', commits: 2, prs: 0, issues: 0 },
      { login: 'dave', name: 'D', contributions: 2, firstContribution: '2024-01-01T00:00:00Z', lastContribution: '2026-05-01T00:00:00Z', commits: 2, prs: 0, issues: 0 },
    ];
    const result = await analyzer.analyze({
      repository: {
        name: 'test', fullName: 'user/test', description: '', language: 'JS',
        stars: 500, forks: 10, openIssues: 5,
        createdAt: '2023-01-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z',
        license: 'MIT', topics: []
      },
      issues: [],
      pullRequests: [],
      contributors,
      commits
    });
    assert.equal(result.metrics.busFactor.riskLevel, 'low');
    assert.ok(!result.recommendations.some(r => r.includes('onboarding')),
      'Should not have onboarding recommendation for low risk');
  });

  it('detects decreasing contributor trend (< 30% recent)', async () => {
    const analyzer = new HealthAnalyzer(6);
    const fourMonthsAgo = new Date();
    fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);

    const contributors = [
      { login: 'a', name: 'A', contributions: 50, firstContribution: '2023-01-01T00:00:00Z', lastContribution: fourMonthsAgo.toISOString(), commits: 40, prs: 5, issues: 5 },
      { login: 'b', name: 'B', contributions: 40, firstContribution: '2023-01-01T00:00:00Z', lastContribution: fourMonthsAgo.toISOString(), commits: 30, prs: 5, issues: 5 },
      { login: 'c', name: 'C', contributions: 30, firstContribution: '2023-01-01T00:00:00Z', lastContribution: fourMonthsAgo.toISOString(), commits: 20, prs: 5, issues: 5 },
      { login: 'd', name: 'D', contributions: 20, firstContribution: '2023-01-01T00:00:00Z', lastContribution: fourMonthsAgo.toISOString(), commits: 15, prs: 3, issues: 2 },
      { login: 'e', name: 'E', contributions: 10, firstContribution: '2023-01-01T00:00:00Z', lastContribution: fourMonthsAgo.toISOString(), commits: 8, prs: 1, issues: 1 },
    ];
    const result = await analyzer.analyze({
      repository: {
        name: 'test', fullName: 'user/test', description: '', language: 'JS',
        stars: 500, forks: 10, openIssues: 5,
        createdAt: '2023-01-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z',
        license: 'MIT', topics: []
      },
      issues: [],
      pullRequests: [],
      contributors,
      commits: [
        { sha: '1', message: 'init', author: 'a', date: '2026-01-01T00:00:00Z', additions: 10, deletions: 0, files: 1 },
      ]
    });
    assert.equal(result.metrics.activity.contributorTrend, 'decreasing');
  });

  it('detects increasing contributor trend (> 70% recent)', async () => {
    const analyzer = new HealthAnalyzer(6);
    const now = new Date().toISOString();

    const contributors = [
      { login: 'a', name: 'A', contributions: 50, firstContribution: '2023-01-01T00:00:00Z', lastContribution: now, commits: 40, prs: 5, issues: 5 },
      { login: 'b', name: 'B', contributions: 40, firstContribution: '2023-01-01T00:00:00Z', lastContribution: now, commits: 30, prs: 5, issues: 5 },
      { login: 'c', name: 'C', contributions: 30, firstContribution: '2023-01-01T00:00:00Z', lastContribution: now, commits: 20, prs: 5, issues: 5 },
      { login: 'd', name: 'D', contributions: 20, firstContribution: '2023-01-01T00:00:00Z', lastContribution: now, commits: 15, prs: 3, issues: 2 },
      { login: 'e', name: 'E', contributions: 10, firstContribution: '2023-01-01T00:00:00Z', lastContribution: now, commits: 8, prs: 1, issues: 1 },
    ];
    const result = await analyzer.analyze({
      repository: {
        name: 'test', fullName: 'user/test', description: '', language: 'JS',
        stars: 500, forks: 10, openIssues: 5,
        createdAt: '2023-01-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z',
        license: 'MIT', topics: []
      },
      issues: [],
      pullRequests: [],
      contributors,
      commits: [
        { sha: '1', message: 'init', author: 'a', date: '2026-01-01T00:00:00Z', additions: 10, deletions: 0, files: 1 },
      ]
    });
    assert.equal(result.metrics.activity.contributorTrend, 'increasing');
  });
});
