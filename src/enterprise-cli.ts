#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { GitHubClient } from './github-client';
import { HealthAnalyzer } from './health-analyzer';
import { DashboardReporter } from './dashboard-reporter';
import { ConfigManager } from './config-manager';
import { promises as fs } from 'fs';
import path from 'path';

const program = new Command();

program
  .name('oss-health-check-enterprise')
  .description('Enterprise-grade OSS project health analysis dashboard')
  .version('1.1.0');

program
  .command('multi-repo')
  .description('Analyze multiple repositories and generate consolidated report')
  .argument('<repo-file>', 'File containing repository URLs (one per line)')
  .option('-o, --output <format>', 'Output format (json|csv|html|dashboard)', 'dashboard')
  .option('--include-trends', 'Include historical trend analysis', true)
  .option('--include-recommendations', 'Include improvement recommendations', true)
  .option('--threshold <score>', 'Minimum health score threshold', '70')
  .option('--export-format <format>', 'Export format for data (json|csv)', 'json')
  .option('--export-path <path>', 'Path for exported data', './exports')
  .option('--slack-webhook <url>', 'Slack webhook URL for notifications')
  .option('--email-report <email>', 'Email for report delivery')
  .action(async (repoFile: string, options: any) => {
    try {
      console.log(chalk.blue('🚀 Enterprise Multi-Repo Analysis'));
      console.log(chalk.gray(`Loading repositories from: ${repoFile}`));
      console.log();

      const repoContent = await fs.readFile(repoFile, 'utf-8');
      const repoUrls = repoContent.split('\n')
        .filter(line => line.trim() && !line.startsWith('#'))
        .map(line => line.trim());

      if (repoUrls.length === 0) {
        console.error(chalk.red('❌ No valid repositories found in file'));
        process.exit(1);
      }

      console.log(chalk.green(`Found ${repoUrls.length} repositories to analyze`));
       
      const config = new ConfigManager();
      const githubClient = new GitHubClient(config.getGitHubToken());
      const analyzer = new HealthAnalyzer(6);
      const threshold = parseInt(options.threshold);

      const results: any[] = [];

      for (const [i, repoUrl] of repoUrls.entries()) {
        console.log(chalk.yellow(`📊 Analyzing repository ${i + 1}/${repoUrls.length}: ${repoUrl}`));
         
        try {
          const repoMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
          if (!repoMatch) {
            console.error(chalk.red(`❌ Invalid repository URL: ${repoUrl}`));
            continue;
          }

          const [_, owner, repo] = repoMatch;
           
          const [repoData, issues, pullRequests, contributors, commits] = await Promise.all([
            githubClient.getRepository(owner, repo),
            githubClient.getIssues(owner, repo, 6),
            githubClient.getPullRequests(owner, repo, 6),
            githubClient.getContributors(owner, repo, 6),
            githubClient.getCommits(owner, repo, 6)
          ]);

          const healthData = await analyzer.analyze({
            repository: repoData,
            issues,
            pullRequests,
            contributors,
            commits
          });

          if (healthData.metrics.overallScore >= threshold) {
            results.push({
              url: repoUrl,
              score: healthData.metrics.overallScore,
              busFactor: healthData.metrics.busFactor,
              diversity: healthData.metrics.diversity,
              responseTime: healthData.metrics.responseTime,
              activity: healthData.metrics.activity,
              sustainability: healthData.metrics.sustainability,
              security: healthData.metrics.security,
              lastUpdated: new Date().toISOString()
            });
          }

          console.log(chalk.green(`✅ Score: ${healthData.metrics.overallScore}/100`));
          
        } catch (error) {
          console.error(chalk.red(`❌ Failed to analyze ${repoUrl}:`));
          console.error(error instanceof Error ? error.message : String(error));
        }
      }

      console.log(chalk.blue('📋 Generating consolidated report...'));
       
      await generateEnterpriseReport(results, options);
       
      if (options.exportPath) {
        await exportResults(results, options);
      }

      console.log(chalk.green('🎉 Enterprise analysis complete!'));

    } catch (error) {
      console.error(chalk.red('❌ Enterprise analysis failed:'));
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('monitor')
  .description('Set up continuous monitoring for repositories')
  .argument('<repo-url>', 'GitHub repository URL to monitor')
  .option('--interval <hours>', 'Monitoring interval in hours', '24')
  .option('--threshold <score>', 'Alert threshold score', '70')
  .option('--alert-email <email>', 'Email for alerts')
  .option('--alert-slack <webhook>', 'Slack webhook for alerts')
  .option('--webhook <url>', 'Webhook URL for notifications')
  .option('--dashboard-port <port>', 'Port for dashboard web server', '3000')
  .option('--export-format <format>', 'Export format for historical data', 'json')
  .action(async (repoUrl: string, options: any) => {
    try {
      console.log(chalk.blue('🚀 Enterprise Health Monitoring'));
      console.log(chalk.gray(`Starting monitoring for: ${repoUrl}`));
      console.log();

      const interval = parseInt(options.interval) * 60 * 60 * 1000; // Convert to milliseconds
      const threshold = parseInt(options.threshold);

      console.log(chalk.yellow(`Monitoring every ${options.interval} hours`));
      console.log(chalk.yellow(`Alert threshold: ${threshold}/100`));
      console.log();

      const repoMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!repoMatch) {
        console.error(chalk.red('❌ Invalid GitHub repository URL'));
        process.exit(1);
      }

      const [_, owner, repo] = repoMatch;
       
      const config = new ConfigManager();
      const githubClient = new GitHubClient(config.getGitHubToken());
      const analyzer = new HealthAnalyzer(6);

      let previousScore = 0;
      let monitoringInterval: NodeJS.Timeout;

      console.log(chalk.green('🟢 Starting continuous monitoring...'));
      console.log(chalk.gray('Press Ctrl+C to stop monitoring'));
      console.log();

      await performHealthCheck(owner, repo, analyzer, githubClient, threshold, options);

      monitoringInterval = setInterval(async () => {
        try {
          await performHealthCheck(owner, repo, analyzer, githubClient, threshold, options);
        } catch (error) {
          console.error(chalk.red('❌ Health check failed:'));
          console.error(error instanceof Error ? error.message : String(error));
        }
      }, interval);

      process.on('SIGINT', () => {
        console.log(chalk.yellow('\n🛑 Stopping monitoring...'));
        clearInterval(monitoringInterval);
        process.exit(0);
      });

    } catch (error) {
      console.error(chalk.red('❌ Monitoring setup failed:'));
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('benchmark')
  .description('Benchmark project against similar repositories')
  .argument('<repo-url>', 'GitHub repository URL to benchmark')
  .option('--category <category>', 'Project category for benchmarking', 'web-development')
  .option('--limit <number>', 'Number of similar repositories to compare', '10')
  .option('--include-metrics', 'Metrics to include (bus-factor,diversity,response-time,activity,sustainability)', 'all')
  .option('--export-report <path>', 'Path for exported benchmark report')
  .action(async (repoUrl: string, options: any) => {
    try {
      console.log(chalk.blue('🚀 Enterprise Benchmark Analysis'));
      console.log(chalk.gray(`Benchmarking: ${repoUrl}`));
      console.log(chalk.gray(`Category: ${options.category}`));
      console.log();

      const repoMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!repoMatch) {
        console.error(chalk.red('❌ Invalid GitHub repository URL'));
        process.exit(1);
      }

      const [_, owner, repo] = repoMatch;
       
      const config = new ConfigManager();
      const githubClient = new GitHubClient(config.getGitHubToken());
      const analyzer = new HealthAnalyzer(6);

      console.log(chalk.yellow('📊 Gathering benchmark data...'));
       
      const repoData = await githubClient.getRepository(owner, repo);
      const benchmarkResults = await performBenchmarkAnalysis(owner, repo, githubClient, analyzer, options);

      console.log(chalk.blue('📋 Benchmark Report'));
      console.log('='.repeat(60));
       
      await generateBenchmarkReport(benchmarkResults, options);

      console.log(chalk.green('🎉 Benchmark analysis complete!'));

    } catch (error) {
      console.error(chalk.red('❌ Benchmark analysis failed:'));
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

async function performHealthCheck(owner: string, repo: string, analyzer: HealthAnalyzer, githubClient: GitHubClient, threshold: number, options: any) {
  try {
    const [repoData, issues, pullRequests, contributors, commits] = await Promise.all([
      githubClient.getRepository(owner, repo),
      githubClient.getIssues(owner, repo, 6),
      githubClient.getPullRequests(owner, repo, 6),
      githubClient.getContributors(owner, repo, 6),
      githubClient.getCommits(owner, repo, 6)
    ]);

    const healthData = await analyzer.analyze({
      repository: repoData,
      issues,
      pullRequests,
      contributors,
      commits
    });

    console.log(`${new Date().toLocaleString()}: Score ${healthData.metrics.overallScore}/100 - ${repoData.name}`);

    if (healthData.metrics.overallScore < threshold) {
      console.log(chalk.red(`⚠️  Alert: Score ${healthData.metrics.overallScore} below threshold ${threshold}`));
      await sendAlert(owner, repo, healthData, threshold, options);
    }

    if (options.exportPath) {
      const exportPath = path.join(options.exportPath, `${owner}-${repo}-health.json`);
      await fs.writeFile(exportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        health: healthData,
        repository: repoData
      }, null, 2));
    }

  } catch (error) {
    console.error(chalk.red(`❌ Health check failed for ${owner}/${repo}:`));
    console.error(error instanceof Error ? error.message : String(error));
  }
}

async function generateEnterpriseReport(results: any[], options: any) {
  const timestamp = new Date().toISOString();
  
  const report = {
    timestamp,
    totalRepositories: results.length,
    averageScore: results.reduce((sum, r) => sum + r.score, 0) / results.length,
    bestPerforming: results.sort((a, b) => b.score - a.score)[0],
    worstPerforming: results.sort((a, b) => a.score - b.score)[0],
    repositories: results
  };

  if (options.output === 'dashboard') {
    console.log(chalk.blue('📊 Enterprise Dashboard Report'));
    console.log('='.repeat(60));
    console.log(`Total Repositories: ${report.totalRepositories}`);
    console.log(`Average Score: ${report.averageScore.toFixed(1)}/100`);
    console.log(`Best Performing: ${report.bestPerforming.url} (${report.bestPerforming.score}/100)`);
    console.log(`Worst Performing: ${report.worstPerforming.url} (${report.worstPerforming.score}/100)`);
    console.log();
    console.log('Repository Scores:');
    results.forEach(r => {
      const color = r.score >= 80 ? chalk.green : r.score >= 60 ? chalk.yellow : chalk.red;
      console.log(`  ${color(`${r.score}/100`)} - ${r.url}`);
    });
  }

  if (options.includeRecommendations) {
    console.log(chalk.blue('\n💡 Improvement Recommendations'));
    results.forEach(r => {
      if (r.busFactor < 0.5) {
        console.log(`  ${r.url}: Low bus factor - consider more code review participation`);
      }
      if (r.diversity < 0.6) {
        console.log(`  ${r.url}: Low contributor diversity - encourage more diverse contributors`);
      }
      if (r.responseTime > 7) {
        console.log(`  ${r.url}: High response time - improve issue/PR review processes`);
      }
    });
  }
}

async function exportResults(results: any[], options: any) {
  const exportPath = options.exportPath;
  await fs.mkdir(exportPath, { recursive: true });

  if (options.exportFormat === 'json') {
    const filePath = path.join(exportPath, `multi-repo-analysis-${new Date().toISOString().split('T')[0]}.json`);
    await fs.writeFile(filePath, JSON.stringify(results, null, 2));
    console.log(chalk.green(`💾 Data exported to: ${filePath}`));
  }

  if (options.exportFormat === 'csv') {
    const filePath = path.join(exportPath, `multi-repo-analysis-${new Date().toISOString().split('T')[0]}.csv`);
    const csvContent = [
      'URL,Score,Bus Factor,Diversity,Response Time,Activity,Sustainability,Security,Last Updated',
      ...results.map(r => [
        r.url,
        r.score,
        r.busFactor,
        r.diversity,
        r.responseTime,
        r.activity,
        r.sustainability,
        r.security,
        r.lastUpdated
      ].join(','))
    ].join('\n');
    await fs.writeFile(filePath, csvContent);
    console.log(chalk.green(`💾 Data exported to: ${filePath}`));
  }
}

async function sendAlert(owner: string, repo: string, healthData: any, threshold: number, options: any) {
  const alert = {
    timestamp: new Date().toISOString(),
    repository: `${owner}/${repo}`,
    currentScore: healthData.metrics.overallScore,
    threshold,
    violations: [
      healthData.metrics.busFactor.score < 0.5 && 'Low bus factor',
      healthData.diversity < 0.6 && 'Low contributor diversity',
      healthData.responseTime > 7 && 'High response time',
      healthData.activity < 0.5 && 'Low activity',
      healthData.sustainability < 0.6 && 'Low sustainability',
      healthData.security < 0.7 && 'Security concerns'
    ].filter(Boolean),
    recommendations: generateRecommendations(healthData)
  };

  if (options.alertSlack) {
    const response = await fetch(options.alertSlack, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 OSS Health Alert: ${owner}/${repo}`,
        attachments: [{
          color: 'danger',
          text: JSON.stringify(alert, null, 2)
        }]
      })
    });
    
    if (response.ok) {
      console.log(chalk.green('✅ Alert sent to Slack'));
    }
  }

  if (options.alertEmail) {
    console.log(chalk.yellow(`📧 Alert email would be sent to: ${options.alertEmail}`));
  }
}

function generateRecommendations(healthData: any) {
  const recommendations = [];
  
  if (healthData.metrics.busFactor.score < 0.5) {
    recommendations.push('Increase code review participation from multiple maintainers');
  }
  if (healthData.diversity < 0.6) {
    recommendations.push('Encourage contributions from more diverse contributors');
  }
  if (healthData.responseTime > 7) {
    recommendations.push('Implement faster issue/PR review processes');
  }
  if (healthData.activity < 0.5) {
    recommendations.push('Increase project activity and community engagement');
  }
  if (healthData.sustainability < 0.6) {
    recommendations.push('Improve long-term sustainability practices');
  }
  if (healthData.security < 0.7) {
    recommendations.push('Enhance security practices and vulnerability management');
  }

  return recommendations;
}

async function performBenchmarkAnalysis(owner: string, repo: string, githubClient: GitHubClient, analyzer: HealthAnalyzer, options: any) {
  // This would typically involve finding similar repositories and comparing metrics
  // For now, return a mock benchmark analysis
  const repoData = await githubClient.getRepository(owner, repo);
  const healthData = await analyzer.analyze({
    repository: repoData,
    issues: [],
    pullRequests: [],
    contributors: [],
    commits: []
  });

  return {
    target: healthData,
    category: options.category,
    similarProjects: [], // Would be populated with actual similar projects
    benchmarks: {
      busFactor: { target: healthData.metrics.busFactor, industry: 0.65 },
      diversity: { target: healthData.metrics.diversity, industry: 0.70 },
      responseTime: { target: healthData.metrics.responseTime, industry: 3.5 },
      activity: { target: healthData.metrics.activity, industry: 0.75 },
      sustainability: { target: healthData.metrics.sustainability, industry: 0.80 },
      security: { target: healthData.metrics.security, industry: 0.85 }
    }
  };
}

async function generateBenchmarkReport(benchmarkResults: any, options: any) {
  console.log(`Target Project: ${benchmarkResults.target.repository?.name || 'Unknown'}`);
  console.log(`Category: ${benchmarkResults.category}`);
  console.log();
  
  console.log('Metric Benchmarking:');
  Object.entries(benchmarkResults.benchmarks).forEach(([metric, data]: [string, any]) => {
    const status = data.target >= data.industry ? '🟢 Above Average' : '🔴 Below Average';
    console.log(`  ${metric}: ${data.target.toFixed(2)} (Industry: ${data.industry.toFixed(2)}) - ${status}`);
  });
}

program.parse();