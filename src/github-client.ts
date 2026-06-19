import { Octokit } from 'octokit';

export interface Repository {
  name: string;
  fullName: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  openIssues: number;
  createdAt: string;
  updatedAt: string;
  license: string;
  topics: string[];
}

export interface Issue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  labels: string[];
  author: string;
  assignees: string[];
  comments: number;
}

export interface PullRequest {
  id: number;
  number: number;
  title: string;
  body: string;
  state: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  author: string;
  reviewers: string[];
  comments: number;
  additions: number;
  deletions: number;
  files: number;
  labels: string[];
}

export interface Commit {
  sha: string;
  message: string;
  author: string;
  date: string;
  additions: number;
  deletions: number;
  files: number;
}

export interface Contributor {
  login: string;
  name: string;
  contributions: number;
  firstContribution: string;
  lastContribution: string;
  commits: number;
  prs: number;
  issues: number;
  email?: string;
}

export interface HealthData {
  repository: Repository;
  analysisDate: string;
  analysisDepth: number;
  metrics: {
    overallScore: number;
    busFactor: { score: number; criticalContributors: string[]; riskLevel: string; distribution: Record<string, number> };
    diversity: { score: number; newContributorsRatio: number; retentionRate: number; geographicDistribution: Record<string, number>; timezoneDistribution: { timezone: string; count: number }[] };
    responseTime: { score: number; averageResponseTime: number; averageResolutionTime: number; issueResponseTime: number; prResponseTime: number };
    activity: { score: number; commitVelocity: number; prVelocity: number; issueVelocity: number; contributorTrend: string };
    sustainability: { score: number; contributorRetention: number; issueBacklog: number; prMergeRate: number; maintenanceIndex: number };
    security: { score: number; vulnerabilityCount: number; dependencyHealth: string; licenseCompliance: boolean };
  };
  insights: string[];
  recommendations: string[];
}

export class GitHubClient {
  private octokit: Octokit;

  constructor(token?: string) {
    this.octokit = new Octokit({
      auth: token || process.env.GITHUB_TOKEN
    });
  }

  async getRepository(owner: string, repo: string): Promise<Repository> {
    const response = await this.octokit.rest.repos.get({
      owner,
      repo
    });

    const data = response.data;
    
    return {
      name: data.name,
      fullName: data.full_name,
      description: data.description || '',
      language: data.language || '',
      stars: data.stargazers_count,
      forks: data.forks_count,
      openIssues: data.open_issues_count,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      license: data.license?.name || 'No license',
      topics: data.topics || []
    };
  }

  async getIssues(owner: string, repo: string, months: number): Promise<Issue[]> {
    const since = new Date();
    since.setMonth(since.getMonth() - months);
    const sinceISO = since.toISOString();
    
    const response = await this.octokit.rest.issues.listForRepo({
      owner,
      repo,
      since: sinceISO,
      state: 'all',
      per_page: 100
    });

    return response.data.map(issue => ({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      body: issue.body || '',
      state: issue.state,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      closedAt: issue.closed_at,
      labels: (issue.labels ?? []).map(label => typeof label === 'string' ? label : label.name ?? '').filter((l): l is string => typeof l === 'string'),
      author: issue.user?.login || '',
      assignees: issue.assignees?.map(assignee => assignee.login) || [],
      comments: issue.comments
    }));
  }

  async getPullRequests(owner: string, repo: string, months: number): Promise<PullRequest[]> {
    const since = new Date();
    since.setMonth(since.getMonth() - months);
    
    const response = await this.octokit.rest.pulls.list({
      owner,
      repo,
      state: 'all',
      sort: 'updated',
      direction: 'desc',
      per_page: 100
    });

    // Filter to only PRs within the analysis window
    const filtered = response.data.filter(pr => new Date(pr.updated_at) >= since);

    return filtered.map((pr: any) => ({
      id: pr.id,
      number: pr.number,
      title: pr.title,
      body: pr.body || '',
      state: pr.state,
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
      closedAt: pr.closed_at ?? null,
      author: pr.user?.login || '',
      reviewers: pr.requested_reviewers?.map((reviewer: any) => reviewer.login) || [],
      comments: pr.comments ?? 0,
      additions: pr.additions ?? 0,
      deletions: pr.deletions ?? 0,
      files: pr.changed_files ?? 0,
      labels: (pr.labels ?? []).map((label: any) => typeof label === 'string' ? label : label.name ?? '').filter((l: string): l is string => typeof l === 'string')
    }));
  }

  async getCommits(owner: string, repo: string, months: number): Promise<Commit[]> {
    const since = new Date();
    since.setMonth(since.getMonth() - months);
    const sinceISO = since.toISOString();
    
    const response = await this.octokit.rest.repos.listCommits({
      owner,
      repo,
      since: sinceISO,
      per_page: 100
    });

    return response.data.map(commit => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: commit.author?.login || commit.commit.author?.name || '',
      date: commit.commit.author?.date || '',
      additions: commit.stats?.additions || 0,
      deletions: commit.stats?.deletions || 0,
      files: commit.files?.length || 0
    }));
  }

  async getContributors(owner: string, repo: string, months: number): Promise<Contributor[]> {
    const since = new Date();
    since.setMonth(since.getMonth() - months);
    const sinceISO = since.toISOString();
    
    const response = await this.octokit.rest.repos.listContributors({
      owner,
      repo,
      per_page: 100
    });

    const contributors: Contributor[] = [];
    for (const c of response.data) {
      if (typeof c.login !== 'string') continue;
      contributors.push({
        login: c.login,
        name: c.login,
        contributions: c.contributions,
        firstContribution: sinceISO,
        lastContribution: sinceISO,
        commits: 0,
        prs: 0,
        issues: 0
      });
    }

    for (const contributor of contributors) {
      try {
        const userResponse = await this.octokit.rest.users.getByUsername({
          username: contributor.login
        });
        
        contributor.email = userResponse.data.email || undefined;
        contributor.name = userResponse.data.name || contributor.login;
      } catch {
        // User might not be accessible (private profile, deleted, etc.)
      }
    }

    return contributors;
  }
}
