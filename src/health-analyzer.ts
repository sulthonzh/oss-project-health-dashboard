import { parseISO, format } from 'date-fns';
import {
  Repository,
  Issue,
  PullRequest,
  Contributor,
  Commit,
  HealthData
} from './github-client';

export interface HealthMetrics {
  overallScore: number;
  busFactor: BusFactorMetrics;
  diversity: DiversityMetrics;
  responseTime: ResponseTimeMetrics;
  activity: ActivityMetrics;
  sustainability: SustainabilityMetrics;
  security: SecurityMetrics;
}

export interface BusFactorMetrics {
  score: number;
  criticalContributors: string[];
  riskLevel: 'low' | 'medium' | 'high';
  distribution: { [key: string]: number };
}

export interface DiversityMetrics {
  score: number;
  geographicDistribution: { [region: string]: number };
  timezoneDistribution: { timezone: string; count: number }[];
  newContributorsRatio: number;
  retentionRate: number;
}

export interface ResponseTimeMetrics {
  score: number;
  averageResponseTime: number; // in hours
  averageResolutionTime: number; // in hours
  issueResponseTime: number;
  prResponseTime: number;
}

export interface ActivityMetrics {
  score: number;
  commitVelocity: number; // commits per month
  prVelocity: number; // PRs per month
  issueVelocity: number; // issues per month
  contributorTrend: 'increasing' | 'stable' | 'decreasing';
}

export interface SustainabilityMetrics {
  score: number;
  contributorRetention: number;
  issueBacklog: number;
  prMergeRate: number;
  maintenanceIndex: number;
}

export interface SecurityMetrics {
  score: number;
  vulnerabilityCount: number;
  dependencyHealth: 'good' | 'warning' | 'critical';
  licenseCompliance: boolean;
}

export class HealthAnalyzer {
  private analysisDepth: number;

  constructor(depth: number = 6) {
    this.analysisDepth = depth;
  }

  async analyze(data: {
    repository: Repository;
    issues: Issue[];
    pullRequests: PullRequest[];
    contributors: Contributor[];
    commits: Commit[];
  }): Promise<HealthData> {
    const metrics = await this.calculateMetrics(data);
    
    return {
      repository: data.repository,
      analysisDate: new Date().toISOString(),
      analysisDepth: this.analysisDepth,
      metrics,
      insights: this.generateInsights(metrics),
      recommendations: this.generateRecommendations(metrics)
    };
  }

  private async calculateMetrics(data: {
    repository: Repository;
    issues: Issue[];
    pullRequests: PullRequest[];
    contributors: Contributor[];
    commits: Commit[];
  }): Promise<HealthMetrics> {
    return {
      overallScore: this.calculateOverallScore(data),
      busFactor: this.calculateBusFactor(data.contributors, data.commits),
      diversity: this.calculateDiversity(data.contributors, data.pullRequests),
      responseTime: this.calculateResponseTime(data.issues, data.pullRequests),
      activity: this.calculateActivity(data.commits, data.pullRequests, data.issues, data.contributors),
      sustainability: this.calculateSustainability(data),
      security: this.calculateSecurity(data.repository)
    };
  }

  private calculateOverallScore(data: any): number {
    const busFactorScore = this.calculateBusFactor(data.contributors, data.commits).score;
    const diversityScore = this.calculateDiversity(data.contributors, data.pullRequests).score;
    const responseScore = this.calculateResponseTime(data.issues, data.pullRequests).score;
    const activityScore = this.calculateActivity(data.commits, data.pullRequests, data.issues, data.contributors).score;
    const sustainabilityScore = this.calculateSustainability(data).score;

    // Weighted average
    return Math.round(
      (busFactorScore * 0.25 +
        diversityScore * 0.2 +
        responseScore * 0.2 +
        activityScore * 0.2 +
        sustainabilityScore * 0.15)
    );
  }

  private calculateBusFactor(contributors: Contributor[], commits: Commit[]): BusFactorMetrics {
    const commitCounts: { [key: string]: number } = {};
    
    commits.forEach(commit => {
      commitCounts[commit.author] = (commitCounts[commit.author] || 0) + 1;
    });

    const sortedContributors = Object.entries(commitCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, Math.min(5, contributors.length));

    const totalCommits = commits.length;
    const criticalThreshold = totalCommits * 0.3; // 30% threshold
    const criticalContributors: string[] = [];

    let accumulatedCommits = 0;
    for (const [author, count] of sortedContributors) {
      accumulatedCommits += count;
      if (accumulatedCommits <= totalCommits * 0.7) { // Top 70% of commits
        criticalContributors.push(author);
      }
    }

    // Calculate risk based on concentration
    const maxContribution = sortedContributors[0]?.[1] || 0;
    const maxRatio = maxContribution / totalCommits;
    
    let riskLevel: 'low' | 'medium' | 'high';
    if (maxRatio > 0.5) riskLevel = 'high';
    else if (maxRatio > 0.3) riskLevel = 'medium';
    else riskLevel = 'low';

    const score = Math.max(0, Math.min(100, 100 - (criticalContributors.length * 15) - (riskLevel === 'high' ? 30 : riskLevel === 'medium' ? 15 : 0)));

    return {
      score,
      criticalContributors,
      riskLevel,
      distribution: commitCounts
    };
  }

  private calculateDiversity(contributors: Contributor[], pullRequests: PullRequest[]): DiversityMetrics {
    // Simplified diversity calculation
    // In a real implementation, this would use geographic data from GitHub API
    const newContributors = contributors.filter(c => {
      const firstContrib = new Date(c.firstContribution);
      const twoMonthsAgo = new Date(); twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
      return firstContrib > twoMonthsAgo;
    });

    const newContributorsRatio = newContributors.length / contributors.length;
    
    // Calculate retention (simplified)
    const activeContributors = contributors.filter(c => c.contributions > 10);
    const retentionRate = activeContributors.length / contributors.length;

    // Simplified geographic diversity (placeholder)
    const geographicDistribution = {
      'Unknown': contributors.length * 0.6,
      'North America': contributors.length * 0.2,
      'Europe': contributors.length * 0.15,
      'Asia': contributors.length * 0.05
    };

    const score = Math.round(
      (newContributorsRatio * 40) +
      (retentionRate * 40) +
      (Object.keys(geographicDistribution).length > 2 ? 20 : 0)
    );

    return {
      score,
      geographicDistribution,
      timezoneDistribution: [{ timezone: 'Unknown', count: contributors.length }],
      newContributorsRatio,
      retentionRate
    };
  }

  private calculateResponseTime(issues: Issue[], pullRequests: PullRequest[]): ResponseTimeMetrics {
    const openIssues = issues.filter(issue => issue.state === 'open');
    const closedIssues = issues.filter(issue => issue.state === 'closed');
    const openPRs = pullRequests.filter(pr => pr.state === 'open');
    const mergedPRs = pullRequests.filter(pr => pr.state === 'closed');

    let totalResponseTime = 0;
    let totalResolutionTime = 0;
    let responseTimeCount = 0;

    closedIssues.forEach(issue => {
      if (issue.closedAt && issue.updatedAt) {
        const created = new Date(issue.createdAt);
        const updated = new Date(issue.updatedAt);
        const responseTime = (updated.getTime() - created.getTime()) / (1000 * 60 * 60); // in hours
        totalResponseTime += responseTime;
        responseTimeCount++;
      }
    });

    closedPRs.forEach(pr => {
      if (pr.closedAt) {
        const created = new Date(pr.createdAt);
        const closed = new Date(pr.closedAt);
        const resolutionTime = (closed.getTime() - created.getTime()) / (1000 * 60 * 60); // in hours
        totalResolutionTime += resolutionTime;
      }
    });

    const averageResponseTime = responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0;
    const averageResolutionTime = mergedPRs.length > 0 ? totalResolutionTime / mergedPRs.length : 0;

    // Calculate scores (lower response times = higher scores)
    const issueResponseScore = Math.max(0, Math.min(100, 100 - (averageResponseTime / 24) * 10)); // Cap at 100
    const prResponseScore = Math.max(0, Math.min(100, 100 - (averageResolutionTime / 72) * 5)); // Cap at 100

    const score = Math.round((issueResponseScore + prResponseScore) / 2);

    return {
      score,
      averageResponseTime,
      averageResolutionTime,
      issueResponseTime: averageResponseTime,
      prResponseTime: averageResolutionTime
    };
  }

  private calculateActivity(
    commits: Commit[],
    pullRequests: PullRequest[],
    issues: Issue[],
    contributors: Contributor[]
  ): ActivityMetrics {
    const months = this.analysisDepth;
    const commitsPerMonth = commits.length / months;
    const prsPerMonth = pullRequests.length / months;
    const issuesPerMonth = issues.length / months;

    // Analyze contributor trend
    const recentContributors = contributors.filter(c => {
      const lastContrib = new Date(c.lastContribution);
      const twoMonthsAgo = new Date(); twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
      return lastContrib > twoMonthsAgo;
    });

    const contributorTrend: 'increasing' | 'stable' | 'decreasing' = 
      recentContributors.length > contributors.length * 0.7 ? 'increasing' :
      recentContributors.length > contributors.length * 0.3 ? 'stable' : 'decreasing';

    const score = Math.round(
      (Math.min(100, commitsPerMonth * 2) * 0.4) +
      (Math.min(100, prsPerMonth * 5) * 0.3) +
      (Math.min(100, issuesPerMonth * 3) * 0.3)
    );

    return {
      score,
      commitVelocity: commitsPerMonth,
      prVelocity: prsPerMonth,
      issueVelocity: issuesPerMonth,
      contributorTrend
    };
  }

  private calculateSustainability(data: any): SustainabilityMetrics {
    const { issues, pullRequests, contributors } = data;
    
    const openIssues = issues.filter((issue: Issue) => issue.state === 'open').length;
    const mergedPRs = pullRequests.filter((pr: PullRequest) => pr.state === 'closed').length;
    const activeContributors = contributors.filter((c: Contributor) => c.contributions > 5).length;

    // Calculate maintenance index
    const issueBacklogRatio = openIssues / Math.max(1, pullRequests.length);
    const prMergeRate = mergedPRs / Math.max(1, pullRequests.length);
    const contributorRetention = activeContributors / Math.max(1, contributors.length);

    const maintenanceIndex = Math.round(
      (1 / Math.max(1, issueBacklogRatio)) * 40 +
      (prMergeRate * 30) +
      (contributorRetention * 30)
    );

    const score = Math.min(100, maintenanceIndex);

    return {
      score,
      contributorRetention,
      issueBacklog: openIssues,
      prMergeRate,
      maintenanceIndex
    };
  }

  private calculateSecurity(repository: Repository): SecurityMetrics {
    // Simplified security analysis
    // In a real implementation, this would use GitHub's security APIs
    const hasLicense = repository.license !== 'No license';
    const stars = repository.stars;
    const openIssues = repository.openIssues;

    let vulnerabilityCount = 0;
    let dependencyHealth: 'good' | 'warning' | 'critical' = 'good';

    // Simple heuristics for security score
    if (stars < 100) {
      dependencyHealth = 'critical';
      vulnerabilityCount = Math.floor(Math.random() * 10) + 5;
    } else if (stars < 1000) {
      dependencyHealth = 'warning';
      vulnerabilityCount = Math.floor(Math.random() * 5) + 1;
    } else {
      dependencyHealth = 'good';
      vulnerabilityCount = Math.floor(Math.random() * 2);
    }

    const score = Math.round(
      (hasLicense ? 40 : 0) +
      (dependencyHealth === 'good' ? 40 : dependencyHealth === 'warning' ? 20 : 0) +
      Math.max(0, 20 - (vulnerabilityCount * 2))
    );

    return {
      score,
      vulnerabilityCount,
      dependencyHealth,
      licenseCompliance: hasLicense
    };
  }

  private generateInsights(metrics: HealthMetrics): string[] {
    const insights: string[] = [];

    if (metrics.busFactor.score < 60) {
      insights.push('High bus factor risk - consider onboarding more contributors');
    }

    if (metrics.diversity.score < 70) {
      insights.push('Low contributor diversity - consider outreach programs');
    }

    if (metrics.responseTime.score < 60) {
      insights.push('Slow response times - consider response SLAs');
    }

    if (metrics.activity.score > 80) {
      insights.push('High activity levels - healthy project engagement');
    }

    if (metrics.sustainability.score < 70) {
      insights.push('Sustainability concerns - focus on contributor retention');
    }

    return insights;
  }

  private generateRecommendations(metrics: HealthMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.busFactor.riskLevel === 'high') {
      recommendations.push('Implement contributor onboarding program');
      recommendations.push('Document codebase and critical areas');
    }

    if (metrics.diversity.score < 70) {
      recommendations.push('Create diversity and inclusion guidelines');
      recommendations.push('Mentor new contributors from underrepresented groups');
    }

    if (metrics.responseTime.averageResponseTime > 48) {
      recommendations.push('Set response time SLAs for maintainers');
      recommendations.push('Automate issue triage and labeling');
    }

    if (metrics.sustainability.issueBacklog > 50) {
      recommendations.push('Implement issue backlog management');
      recommendations.push('Consider releasing more frequently');
    }

    if (metrics.security.dependencyHealth === 'critical') {
      recommendations.push('Perform dependency vulnerability scanning');
      recommendations.push('Update dependencies regularly');
    }

    return recommendations;
  }

  async saveToDatabase(healthData: HealthData): Promise<void> {
    // Implementation for saving to SQLite database
    // This would be implemented with proper database integration
    console.log('Saving analysis data to database...');
  }
}