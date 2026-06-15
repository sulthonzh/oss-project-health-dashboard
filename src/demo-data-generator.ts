/**
 * Demo Data Generator for OSS Project Health Dashboard
 * 
 * This module provides realistic mock data for demonstration purposes.
 * When GitHub API access is available, it will be replaced with real data.
 */

export interface DemoRepository {
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

export interface DemoContributor {
  id: number;
  login: string;
  name: string;
  avatar_url: string;
  contributions: number;
  email?: string;
}

export interface DemoIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  labels: string[];
  author: string;
  assignees: string[];
  comments: number;
}

export interface DemoPullRequest {
  id: number;
  number: number;
  title: string;
  body: string;
  state: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  author: string;
  reviewers: string[];
  comments: number;
  additions: number;
  deletions: number;
  files: number;
  labels: string[];
}

export class DemoDataGenerator {
   
  static generateRepository(repoUrl: string): DemoRepository {
    const [_, owner, repo] = repoUrl.replace('https://github.com/', '').split('/');
    
    return {
      name: repo,
      fullName: `${owner}/${repo}`,
      description: "Powerful open-source project with comprehensive features and active community",
      language: this.getRandomLanguage(),
      stars: this.getRandomStars(),
      forks: Math.floor(this.getRandomStars() * 0.2),
      openIssues: Math.floor(Math.random() * 50) + 10,
      createdAt: this.getRandomDate(-730), // 2 years ago
      updatedAt: this.getRandomDate(-7),
      license: this.getRandomLicense(),
      topics: this.getRandomTopics()
    };
  }
   
  static generateContributors(count: number = 10): DemoContributor[] {
    const contributorNames = [
      { login: 'sulthonzh', name: 'Sulthon Zh', email: 'sulthonzh@example.com' },
      { login: 'alice', name: 'Alice Johnson', email: 'alice@example.com' },
      { login: 'bob', name: 'Bob Smith', email: 'bob@example.com' },
      { login: 'carol', name: 'Carol Davis', email: 'carol@example.com' },
      { login: 'david', name: 'David Wilson', email: 'david@example.com' },
      { login: 'emma', name: 'Emma Brown', email: 'emma@example.com' },
      { login: 'frank', name: 'Frank Miller', email: 'frank@example.com' },
      { login: 'grace', name: 'Grace Lee', email: 'grace@example.com' },
      { login: 'henry', name: 'Henry Taylor', email: 'henry@example.com' },
      { login: 'iris', name: 'Iris Chen', email: 'iris@example.com' }
    ];
    
    const contributors: DemoContributor[] = contributorNames.slice(0, count).map((name, index) => ({
      id: 1000 + index,
      login: name.login,
      name: name.name,
      avatar_url: `https://github.com/${name.login}.png`,
      contributions: Math.floor(Math.random() * 1000) + 10,
      email: name.email
    }));
    
    // Sort by contributions (highest first)
    return contributors.sort((a, b) => b.contributions - a.contributions);
  }
   
  static generateIssues(count: number = 20): DemoIssue[] {
    const issueTitles = [
      "Add new feature X",
      "Fix performance issue in module Y",
      "Update dependencies for security",
      "Improve documentation for Z",
      "Add unit tests for function A",
      "Refactor code for better maintainability",
      "Add configuration option B",
      "Fix typo in README",
      "Update API documentation",
      "Add error handling for edge cases"
    ];
    
    const labels = ['bug', 'enhancement', 'documentation', 'performance', 'question', 'wontfix', 'duplicate'];
    const authors = ['sulthonzh', 'alice', 'bob', 'carol', 'david'];
    
    return Array.from({ length: count }, (_, index) => {
      const createdAt = this.getRandomDate(-180);
      const updatedAt = this.getRandomDate(-1);
      const state = Math.random() > 0.3 ? 'open' : 'closed';
      
      return {
        id: 1000 + index,
        number: 100 + index,
        title: issueTitles[index % issueTitles.length] + (count > issueTitles.length ? ` ${index + 1}` : ''),
        body: 'This is a detailed description of the issue. It includes context, steps to reproduce, and expected behavior.',
        state,
        createdAt,
        updatedAt,
        closedAt: state === 'closed' ? this.getRandomDate(-30) : undefined,
        labels: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => 
          labels[Math.floor(Math.random() * labels.length)]
        ),
        author: authors[Math.floor(Math.random() * authors.length)],
        assignees: [authors[Math.floor(Math.random() * authors.length)]],
        comments: Math.floor(Math.random() * 20)
      };
    });
  }
   
  static generatePullRequests(count: number = 15): DemoPullRequest[] {
    const prTitles = [
      "feat: Add new authentication method",
      "fix: Resolve memory leak in connection pool",
      "docs: Update API documentation",
      "refactor: Simplify complex function",
      "test: Add comprehensive test coverage",
      "perf: Optimize database queries",
      "ci: Update GitHub Actions workflow",
      "chore: Deprecate legacy API endpoint",
      "build: Update project dependencies",
      "style: Fix code formatting issues"
    ];
    
    const labels = ['bug', 'enhancement', 'documentation', 'performance', 'breaking-change'];
    const authors = ['alice', 'bob', 'carol', 'david', 'emma'];
    const reviewers = ['sulthonzh', 'alice', 'bob'];
    
    return Array.from({ length: count }, (_, index) => {
      const createdAt = this.getRandomDate(-180);
      const updatedAt = this.getRandomDate(-1);
      const state = Math.random() > 0.2 ? 'merged' : 'open';
      
      return {
        id: 2000 + index,
        number: 500 + index,
        title: prTitles[index % prTitles.length] + (count > prTitles.length ? ` ${index + 1}` : ''),
        body: 'This pull request includes significant improvements to the codebase. It addresses the following changes:\n\n1. Feature implementation\n2. Bug fixes\n3. Documentation updates\n4. Performance optimizations',
        state,
        createdAt,
        updatedAt,
        closedAt: state !== 'open' ? this.getRandomDate(-15) : undefined,
        author: authors[Math.floor(Math.random() * authors.length)],
        reviewers: reviewers.slice(0, Math.floor(Math.random() * 2) + 1),
        comments: Math.floor(Math.random() * 15),
        additions: Math.floor(Math.random() * 500) + 50,
        deletions: Math.floor(Math.random() * 200) + 10,
        files: Math.floor(Math.random() * 20) + 1,
        labels: Array.from({ length: Math.floor(Math.random() * 2) + 1 }, () => 
          labels[Math.floor(Math.random() * labels.length)]
        )
      };
    });
  }
   
  static getBusFactorAnalysis(contributors: DemoContributor[]) {
    const totalCommits = contributors.reduce((sum, c) => sum + c.contributions, 0);
    const criticalThreshold = totalCommits * 0.3; // 30% of commits
    
    const criticalContributors = contributors
      .filter(c => c.contributions > criticalThreshold)
      .map(c => c.name);
    
    return {
      score: Math.floor(Math.random() * 20) + 70, // 70-90
      criticalContributors,
      riskLevel: criticalContributors.length > 2 ? 'medium' : 'low',
      distribution: contributors.reduce((acc, c) => {
        acc[c.name] = Math.round((c.contributions / totalCommits) * 100);
        return acc;
      }, {} as Record<string, number>)
    };
  }
   
  private static getRandomLanguage(): string {
    const languages = ['TypeScript', 'JavaScript', 'Python', 'Rust', 'Go', 'Java', 'C++', 'PHP'];
    return languages[Math.floor(Math.random() * languages.length)];
  }
  
  private static getRandomStars(): number {
    // Power law distribution for stars
    const base = 1000;
    const exponent = -1.5;
    const rand = Math.random();
    return Math.floor(base * Math.pow(rand, exponent));
  }
  
  private static getRandomLicense(): string {
    const licenses = ['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause', 'ISC', 'Unlicense'];
    return licenses[Math.floor(Math.random() * licenses.length)];
  }
  
  private static getRandomTopics(): string[] {
    const topics = [
      'typescript', 'javascript', 'github-api', 'analytics', 'metrics',
      'sustainability', 'developer-tools', 'oss', 'open-source',
      'cli', 'dashboard', 'health-check', 'bus-factor'
    ];
    const count = Math.floor(Math.random() * 4) + 2;
    const selected: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const topic = topics[Math.floor(Math.random() * topics.length)];
      if (!selected.includes(topic)) {
        selected.push(topic);
      }
    }
    
    return selected;
  }
  
  private static getRandomDate(daysAgo: number): string {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
    return date.toISOString();
  }
}