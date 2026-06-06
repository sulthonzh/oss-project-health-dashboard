import { describe, it, expect } from 'vitest';
import { 
  BusFactorResult, 
  DiversityResult, 
  ResponseTimeResult, 
  ActivityResult, 
  SustainabilityResult,
  HealthScore,
  RepositoryInfo
} from './types';

describe('Type Definitions', () => {
  describe('BusFactorResult', () => {
    it('should have required properties for bus factor analysis', () => {
      const busFactorResult: BusFactorResult = {
        score: 85,
        riskLevel: 'low',
        busFactor: 0.75,
        totalContributors: 10,
        topContributors: [
          { login: 'user1', contributions: 150 },
          { login: 'user2', contributions: 120 },
          { login: 'user3', contributions: 100 },
        ]
      };

      expect(busFactorResult).toHaveProperty('score');
      expect(busFactorResult).toHaveProperty('riskLevel');
      expect(busFactorResult).toHaveProperty('busFactor');
      expect(busFactorResult).toHaveProperty('totalContributors');
      expect(busFactorResult).toHaveProperty('topContributors');
      
      expect(typeof busFactorResult.score).toBe('number');
      expect(typeof busFactorResult.riskLevel).toBe('string');
      expect(typeof busFactorResult.busFactor).toBe('number');
      expect(typeof busFactorResult.totalContributors).toBe('number');
      expect(Array.isArray(busFactorResult.topContributors)).toBe(true);
    });

    it('should validate risk level values', () => {
      const validRiskLevels = ['low', 'medium', 'high'];
      
      validRiskLevels.forEach(riskLevel => {
        const result: BusFactorResult = {
          score: 50,
          riskLevel,
          busFactor: 0.5,
          totalContributors: 5,
          topContributors: []
        };
        expect(result.riskLevel).toBe(riskLevel);
      });
    });

    it('should validate bus factor range', () => {
      const validBusFactors = [0, 0.5, 1.0];
      
      validBusFactors.forEach(busFactor => {
        const result: BusFactorResult = {
          score: 50,
          riskLevel: 'medium',
          busFactor,
          totalContributors: 5,
          topContributors: []
        };
        expect(result.busFactor).toBe(busFactor);
        expect(result.busFactor).toBeGreaterThanOrEqual(0);
        expect(result.busFactor).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('DiversityResult', () => {
    it('should have required properties for diversity analysis', () => {
      const diversityResult: DiversityResult = {
        score: 80,
        geographicDiversity: 0.75,
        contributorCount: 8,
        uniqueLocations: ['USA', 'UK', 'Japan', 'Germany'],
        retentionRate: 0.85
      };

      expect(diversityResult).toHaveProperty('score');
      expect(diversityResult).toHaveProperty('geographicDiversity');
      expect(diversityResult).toHaveProperty('contributorCount');
      expect(diversityResult).toHaveProperty('uniqueLocations');
      expect(diversityResult).toHaveProperty('retentionRate');
      
      expect(typeof diversityResult.score).toBe('number');
      expect(typeof diversityResult.geographicDiversity).toBe('number');
      expect(typeof diversityResult.contributorCount).toBe('number');
      expect(Array.isArray(diversityResult.uniqueLocations)).toBe(true);
      expect(typeof diversityResult.retentionRate).toBe('number');
    });

    it('should validate geographic diversity range', () => {
      const validGeographicDiversities = [0, 0.5, 1.0];
      
      validGeographicDiversities.forEach(diversity => {
        const result: DiversityResult = {
          score: 50,
          geographicDiversity: diversity,
          contributorCount: 5,
          uniqueLocations: ['USA'],
          retentionRate: 0.5
        };
        expect(result.geographicDiversity).toBe(diversity);
        expect(result.geographicDiversity).toBeGreaterThanOrEqual(0);
        expect(result.geographicDiversity).toBeLessThanOrEqual(1);
      });
    });

    it('should validate retention rate range', () => {
      const validRetentionRates = [0, 0.5, 1.0];
      
      validRetentionRates.forEach(retentionRate => {
        const result: DiversityResult = {
          score: 50,
          geographicDiversity: 0.5,
          contributorCount: 5,
          uniqueLocations: ['USA'],
          retentionRate
        };
        expect(result.retentionRate).toBe(retentionRate);
        expect(result.retentionRate).toBeGreaterThanOrEqual(0);
        expect(result.retentionRate).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('ResponseTimeResult', () => {
    it('should have required properties for response time analysis', () => {
      const responseTimeResult: ResponseTimeResult = {
        score: 75,
        averageResponseTime: 36 * 60 * 60 * 1000, // 36 hours
        medianResponseTime: 24 * 60 * 60 * 1000, // 24 hours
        p25ResponseTime: 12 * 60 * 60 * 1000, // 12 hours
        p75ResponseTime: 48 * 60 * 60 * 1000, // 48 hours
        p95ResponseTime: 72 * 60 * 60 * 1000, // 72 hours
      };

      expect(responseTimeResult).toHaveProperty('score');
      expect(responseTimeResult).toHaveProperty('averageResponseTime');
      expect(responseTimeResult).toHaveProperty('medianResponseTime');
      expect(responseTimeResult).toHaveProperty('p25ResponseTime');
      expect(responseTimeResult).toHaveProperty('p75ResponseTime');
      expect(responseTimeResult).toHaveProperty('p95ResponseTime');
      
      expect(typeof responseTimeResult.score).toBe('number');
      expect(typeof responseTimeResult.averageResponseTime).toBe('number');
      expect(typeof responseTimeResult.medianResponseTime).toBe('number');
      expect(typeof responseTimeResult.p25ResponseTime).toBe('number');
      expect(typeof responseTimeResult.p75ResponseTime).toBe('number');
      expect(typeof responseTimeResult.p95ResponseTime).toBe('number');
    });

    it('should validate response times are positive', () => {
      const result: ResponseTimeResult = {
        score: 50,
        averageResponseTime: 24 * 60 * 60 * 1000,
        medianResponseTime: 18 * 60 * 60 * 1000,
        p25ResponseTime: 6 * 60 * 60 * 1000,
        p75ResponseTime: 36 * 60 * 60 * 1000,
        p95ResponseTime: 48 * 60 * 60 * 1000,
      };

      expect(result.averageResponseTime).toBeGreaterThan(0);
      expect(result.medianResponseTime).toBeGreaterThan(0);
      expect(result.p25ResponseTime).toBeGreaterThan(0);
      expect(result.p75ResponseTime).toBeGreaterThan(0);
      expect(result.p95ResponseTime).toBeGreaterThan(0);
    });
  });

  describe('ActivityResult', () => {
    it('should have required properties for activity analysis', () => {
      const activityResult: ActivityResult = {
        score: 85,
        commitFrequency: 25,
        issueResolutionRate: 0.85,
        prMergeRate: 0.9,
        lastActivity: new Date().toISOString(),
      };

      expect(activityResult).toHaveProperty('score');
      expect(activityResult).toHaveProperty('commitFrequency');
      expect(activityResult).toHaveProperty('issueResolutionRate');
      expect(activityResult).toHaveProperty('prMergeRate');
      expect(activityResult).toHaveProperty('lastActivity');
      
      expect(typeof activityResult.score).toBe('number');
      expect(typeof activityResult.commitFrequency).toBe('number');
      expect(typeof activityResult.issueResolutionRate).toBe('number');
      expect(typeof activityResult.prMergeRate).toBe('number');
      expect(typeof activityResult.lastActivity).toBe('string');
    });

    it('should validate rates are between 0 and 1', () => {
      const result: ActivityResult = {
        score: 50,
        commitFrequency: 15,
        issueResolutionRate: 0.75,
        prMergeRate: 0.8,
        lastActivity: new Date().toISOString(),
      };

      expect(result.issueResolutionRate).toBeGreaterThanOrEqual(0);
      expect(result.issueResolutionRate).toBeLessThanOrEqual(1);
      expect(result.prMergeRate).toBeGreaterThanOrEqual(0);
      expect(result.prMergeRate).toBeLessThanOrEqual(1);
    });

    it('should validate commit frequency is non-negative', () => {
      const result: ActivityResult = {
        score: 50,
        commitFrequency: 10,
        issueResolutionRate: 0.5,
        prMergeRate: 0.5,
        lastActivity: new Date().toISOString(),
      };

      expect(result.commitFrequency).toBeGreaterThanOrEqual(0);
    });
  });

  describe('SustainabilityResult', () => {
    it('should have required properties for sustainability analysis', () => {
      const sustainabilityResult: SustainabilityResult = {
        score: 80,
        starGrowthRate: 0.2,
        contributorGrowthRate: 0.15,
        issueClosureRate: 0.8,
        forkCount: 5,
        lastUpdated: new Date().toISOString(),
      };

      expect(sustainabilityResult).toHaveProperty('score');
      expect(sustainabilityResult).toHaveProperty('starGrowthRate');
      expect(sustainabilityResult).toHaveProperty('contributorGrowthRate');
      expect(sustainabilityResult).toHaveProperty('issueClosureRate');
      expect(sustainabilityResult).toHaveProperty('forkCount');
      expect(sustainabilityResult).toHaveProperty('lastUpdated');
      
      expect(typeof sustainabilityResult.score).toBe('number');
      expect(typeof sustainabilityResult.starGrowthRate).toBe('number');
      expect(typeof sustainabilityResult.contributorGrowthRate).toBe('number');
      expect(typeof sustainabilityResult.issueClosureRate).toBe('number');
      expect(typeof sustainabilityResult.forkCount).toBe('number');
      expect(typeof sustainabilityResult.lastUpdated).toBe('string');
    });

    it('should validate growth rates are non-negative', () => {
      const result: SustainabilityResult = {
        score: 50,
        starGrowthRate: 0.1,
        contributorGrowthRate: 0.05,
        issueClosureRate: 0.7,
        forkCount: 2,
        lastUpdated: new Date().toISOString(),
      };

      expect(result.starGrowthRate).toBeGreaterThanOrEqual(0);
      expect(result.contributorGrowthRate).toBeGreaterThanOrEqual(0);
      expect(result.issueClosureRate).toBeGreaterThanOrEqual(0);
      expect(result.issueClosureRate).toBeLessThanOrEqual(1);
      expect(result.forkCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('HealthScore', () => {
    it('should have required properties for overall health score', () => {
      const healthScore: HealthScore = {
        overallScore: 85,
        metrics: {
          busFactor: {
            score: 90,
            riskLevel: 'low',
            busFactor: 0.75,
            totalContributors: 10,
            topContributors: []
          },
          diversity: {
            score: 80,
            geographicDiversity: 0.7,
            contributorCount: 10,
            uniqueLocations: ['USA', 'UK'],
            retentionRate: 0.8
          },
          responseTime: {
            score: 75,
            averageResponseTime: 36 * 60 * 60 * 1000,
            medianResponseTime: 24 * 60 * 60 * 1000,
            p25ResponseTime: 12 * 60 * 60 * 1000,
            p75ResponseTime: 48 * 60 * 60 * 1000,
            p95ResponseTime: 72 * 60 * 60 * 1000,
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

      expect(healthScore).toHaveProperty('overallScore');
      expect(healthScore).toHaveProperty('metrics');
      expect(healthScore).toHaveProperty('repository');
      
      expect(typeof healthScore.overallScore).toBe('number');
      expect(healthScore.overallScore).toBeGreaterThanOrEqual(0);
      expect(healthScore.overallScore).toBeLessThanOrEqual(100);
      
      expect(healthScore.metrics).toHaveProperty('busFactor');
      expect(healthScore.metrics).toHaveProperty('diversity');
      expect(healthScore.metrics).toHaveProperty('responseTime');
      expect(healthScore.metrics).toHaveProperty('activity');
      expect(healthScore.metrics).toHaveProperty('sustainability');
      
      expect(healthScore.repository).toHaveProperty('name');
      expect(healthScore.repository).toHaveProperty('full_name');
      expect(healthScore.repository).toHaveProperty('stargazers_count');
      expect(healthScore.repository).toHaveProperty('forks_count');
      expect(healthScore.repository).toHaveProperty('open_issues_count');
      expect(healthScore.repository).toHaveProperty('language');
      expect(healthScore.repository).toHaveProperty('created_at');
    });

    it('should validate overall score range', () => {
      const validScores = [0, 50, 100];
      
      validScores.forEach(score => {
        const healthScore: HealthScore = {
          overallScore: score,
          metrics: {
            busFactor: { score: 50, riskLevel: 'medium', busFactor: 0.5, totalContributors: 5, topContributors: [] },
            diversity: { score: 50, geographicDiversity: 0.5, contributorCount: 5, uniqueLocations: [], retentionRate: 0.5 },
            responseTime: { score: 50, averageResponseTime: 24 * 60 * 60 * 1000, medianResponseTime: 24 * 60 * 60 * 1000, p25ResponseTime: 24 * 60 * 60 * 1000, p75ResponseTime: 24 * 60 * 60 * 1000, p95ResponseTime: 24 * 60 * 60 * 1000 },
            activity: { score: 50, commitFrequency: 10, issueResolutionRate: 0.5, prMergeRate: 0.5, lastActivity: new Date().toISOString() },
            sustainability: { score: 50, starGrowthRate: 0.1, contributorGrowthRate: 0.1, issueClosureRate: 0.5, forkCount: 1, lastUpdated: new Date().toISOString() }
          },
          repository: {
            name: 'test',
            full_name: 'owner/test',
            description: 'Test',
            stargazers_count: 10,
            forks_count: 1,
            open_issues_count: 5,
            language: 'JavaScript',
            created_at: new Date().toISOString()
          }
        };
        expect(healthScore.overallScore).toBe(score);
        expect(healthScore.overallScore).toBeGreaterThanOrEqual(0);
        expect(healthScore.overallScore).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('RepositoryInfo', () => {
    it('should have required properties for repository information', () => {
      const repoInfo: RepositoryInfo = {
        id: 123,
        name: 'test-repo',
        full_name: 'owner/test-repo',
        description: 'Test repository',
        stargazers_count: 100,
        watchers_count: 50,
        forks_count: 25,
        open_issues_count: 10,
        language: 'TypeScript',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        archived: false,
        disabled: false,
      };

      expect(repoInfo).toHaveProperty('id');
      expect(repoInfo).toHaveProperty('name');
      expect(repoInfo).toHaveProperty('full_name');
      expect(repoInfo).toHaveProperty('description');
      expect(repoInfo).toHaveProperty('stargazers_count');
      expect(repoInfo).toHaveProperty('watchers_count');
      expect(repoInfo).toHaveProperty('forks_count');
      expect(repoInfo).toHaveProperty('open_issues_count');
      expect(repoInfo).toHaveProperty('language');
      expect(repoInfo).toHaveProperty('created_at');
      expect(repoInfo).toHaveProperty('updated_at');
      expect(repoInfo).toHaveProperty('archived');
      expect(repoInfo).toHaveProperty('disabled');
      
      expect(typeof repoInfo.id).toBe('number');
      expect(typeof repoInfo.name).toBe('string');
      expect(typeof repoInfo.full_name).toBe('string');
      expect(typeof repoInfo.description).toBe('string');
      expect(typeof repoInfo.stargazers_count).toBe('number');
      expect(typeof repoInfo.watchers_count).toBe('number');
      expect(typeof repoInfo.forks_count).toBe('number');
      expect(typeof repoInfo.open_issues_count).toBe('number');
      expect(typeof repoInfo.language).toBe('string');
      expect(typeof repoInfo.created_at).toBe('string');
      expect(typeof repoInfo.updated_at).toBe('string');
      expect(typeof repoInfo.archived).toBe('boolean');
      expect(typeof repoInfo.disabled).toBe('boolean');
    });

    it('should validate numeric properties are non-negative', () => {
      const repoInfo: RepositoryInfo = {
        id: 123,
        name: 'test-repo',
        full_name: 'owner/test-repo',
        description: 'Test repository',
        stargazers_count: 100,
        watchers_count: 50,
        forks_count: 25,
        open_issues_count: 10,
        language: 'TypeScript',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        archived: false,
        disabled: false,
      };

      expect(repoInfo.id).toBeGreaterThan(0);
      expect(repoInfo.stargazers_count).toBeGreaterThanOrEqual(0);
      expect(repoInfo.watchers_count).toBeGreaterThanOrEqual(0);
      expect(repoInfo.forks_count).toBeGreaterThanOrEqual(0);
      expect(repoInfo.open_issues_count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle minimal valid data', () => {
      const minimalHealthScore: HealthScore = {
        overallScore: 0,
        metrics: {
          busFactor: { score: 0, riskLevel: 'low', busFactor: 0, totalContributors: 0, topContributors: [] },
          diversity: { score: 0, geographicDiversity: 0, contributorCount: 0, uniqueLocations: [], retentionRate: 0 },
          responseTime: { score: 0, averageResponseTime: 0, medianResponseTime: 0, p25ResponseTime: 0, p75ResponseTime: 0, p95ResponseTime: 0 },
          activity: { score: 0, commitFrequency: 0, issueResolutionRate: 0, prMergeRate: 0, lastActivity: new Date().toISOString() },
          sustainability: { score: 0, starGrowthRate: 0, contributorGrowthRate: 0, issueClosureRate: 0, forkCount: 0, lastUpdated: new Date().toISOString() }
        },
        repository: {
          id: 1,
          name: 'minimal',
          full_name: 'owner/minimal',
          description: 'Minimal repo',
          stargazers_count: 0,
          watchers_count: 0,
          forks_count: 0,
          open_issues_count: 0,
          language: 'None',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          archived: false,
          disabled: false,
        }
      };

      expect(healthScore(healthScore)).toBe(true);
    });

    it('should handle maximum valid data', () => {
      const maximumHealthScore: HealthScore = {
        overallScore: 100,
        metrics: {
          busFactor: { score: 100, riskLevel: 'low', busFactor: 1, totalContributors: 1000, topContributors: [] },
          diversity: { score: 100, geographicDiversity: 1, contributorCount: 1000, uniqueLocations: [], retentionRate: 1 },
          responseTime: { score: 100, averageResponseTime: 1, medianResponseTime: 1, p25ResponseTime: 1, p75ResponseTime: 1, p95ResponseTime: 1 },
          activity: { score: 100, commitFrequency: 1000, issueResolutionRate: 1, prMergeRate: 1, lastActivity: new Date().toISOString() },
          sustainability: { score: 100, starGrowthRate: 1, contributorGrowthRate: 1, issueClosureRate: 1, forkCount: 1000, lastUpdated: new Date().toISOString() }
        },
        repository: {
          id: Number.MAX_SAFE_INTEGER,
          name: 'maximum',
          full_name: 'owner/maximum',
          description: 'Maximum repo',
          stargazers_count: Number.MAX_SAFE_INTEGER,
          watchers_count: Number.MAX_SAFE_INTEGER,
          forks_count: Number.MAX_SAFE_INTEGER,
          open_issues_count: Number.MAX_SAFE_INTEGER,
          language: 'Multiple',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          archived: true,
          disabled: true,
        }
      };

      expect(healthScore(maximumHealthScore)).toBe(true);
    });
  });

  // Helper function to validate HealthScore structure
  function healthScore(data: any): boolean {
    return (
      typeof data.overallScore === 'number' &&
      data.overallScore >= 0 &&
      data.overallScore <= 100 &&
      typeof data.metrics === 'object' &&
      data.metrics.busFactor &&
      data.metrics.diversity &&
      data.metrics.responseTime &&
      data.metrics.activity &&
      data.metrics.sustainability &&
      typeof data.repository === 'object'
    );
  }
});