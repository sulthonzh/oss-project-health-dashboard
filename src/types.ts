// Export types from github-client for use in other modules
export {
  Repository,
  Issue,
  PullRequest,
  Commit,
  Contributor,
  HealthData
} from './github-client';

// Export all metric interfaces
export {
  HealthMetrics,
  BusFactorMetrics,
  DiversityMetrics,
  ResponseTimeMetrics,
  ActivityMetrics,
  SustainabilityMetrics,
  SecurityMetrics
} from './health-analyzer';