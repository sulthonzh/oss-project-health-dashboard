import { Octokit } from 'octokit';
import { DateTime } from 'date-fns';

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
  closedAt: string;
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
  closedAt: string;
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
    const since = DateTime.now().subtract({ months }).toISOString();
    
    const response = await this.octokit.rest.issues.listForRepo({
      owner,
      repo,
      since,
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
      labels: issue.labels?.map(label => typeof label === 'string' ? label : label.name) || [],
      author: issue.user?.login || '',
      assignees: issue.assignees?.map(assignee => assignee.login) || [],
      comments: issue.comments
    }));
  }

  async getPullRequests(owner: string, repo: string, months: number): Promise<PullRequest[]> {
    const since = DateTime.now().subtract({ months }).toISOString();
    
    const response = await this.octokit.rest.pulls.list({
      owner,
      repo,
      since,
      state: 'all',
      per_page: 100
    });

    return response.data.map(pr => ({
      id: pr.id,
      number: pr.number,
      title: pr.title,
      body: pr.body || '',
      state: pr.state,
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
      closedAt: pr.closed_at,
      author: pr.user?.login || '',
      reviewers: pr.requested_reviewers?.map(reviewer => reviewer.login) || [],
      comments: pr.comments,
      additions: pr.additions,
      deletions: pr.deletions,
      files: pr.changed_files,
      labels: pr.labels?.map(label => typeof label === 'string' ? label : label.name) || []
    }));
  }

  async getCommits(owner: string, repo: string, months: number): Promise<Commit[]> {
    const since = DateTime.now().subtract({ months }).toISOString();
    
    const response = await this.octokit.rest.repos.listCommits({
      owner,
      repo,
      since,
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
    const since = DateTime.now().subtract({ months }).toISOString();
    
    const response = await this.octokit.rest.repos.listContributors({
      owner,
      repo,
      per_page: 100
    });

    const contributors: Contributor[] = response.data.map(contributor => ({
      login: contributor.login,
      name: contributor.name || contributor.login,
      contributions: contributor.contributions,
      firstContribution: since,
      lastContribution: since,
      commits: 0,
      prs: 0,
      issues: 0
    }));

    // Get detailed contributor information
    for (const contributor of contributors) {
      try {
        // Get user data for email and better name
        const userResponse = await this.octokit.rest.users.getByUsername({
          username: contributor.login
        });
        
        contributor.email = userResponse.data.email;
        contributor.name = userResponse.data.name || contributor.login;
      } catch (error) {
        // User might not be accessible (private profile, deleted, etc.)
        console.warn(`Warning: Could not fetch details for contributor ${contributor.login}`);
      }
    }

    return contributors;
  }
}