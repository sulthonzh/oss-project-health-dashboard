#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { GitHubClient } from './github-client';
import { HealthAnalyzer } from './health-analyzer';
import { DashboardReporter } from './dashboard-reporter';
import { ConfigManager } from './config-manager';

const program = new Command();

program
  .name('oss-health-check')
  .description('One-command OSS project health analysis dashboard')
  .version('1.0.0')
  .argument('<repo-url>', 'GitHub repository URL (owner/repo format)')
  .option('-d, --depth <number>', 'Analysis depth (months)', '6')
  .option('-t, --token <string>', 'GitHub personal access token')
  .option('-o, --output <format>', 'Output format (table|json|markdown|web)', 'table')
  .option('--include-issues', 'Include issue analysis', true)
  .option('--include-prs', 'Include pull request analysis', true)
  .option('--include-contributors', 'Include detailed contributor analysis', true)
  .option('--include-bus-factor', 'Include bus factor analysis', true)
  .option('--include-security', 'Include security analysis', true)
  .option('--save-data', 'Save analysis data to local database', false)
  .option('--benchmark', 'Show benchmark against similar projects', false)
  .action(async (repoUrl: string, options: any) => {
    try {
      console.log(chalk.blue('🚀 OSS Project Health Dashboard'));
      console.log(chalk.gray(`Analyzing: ${repoUrl}`));
      console.log();

      // Parse repository URL
      const repoMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!repoMatch) {
        console.error(chalk.red('❌ Invalid GitHub repository URL'));
        console.error('Expected format: https://github.com/owner/repo');
        process.exit(1);
      }

      const [_, owner, repo] = repoMatch;
      
      // Initialize components
      const config = new ConfigManager();
      const githubClient = new GitHubClient(options.token || config.getGitHubToken());
      const analyzer = new HealthAnalyzer(parseInt(options.depth));
      const reporter = new DashboardReporter(options.output);

      console.log(chalk.yellow('📊 Gathering project data...'));
      
      // Fetch repository data
      const repoData = await githubClient.getRepository(owner, repo);
      
      // Fetch analysis data
      const issues = options.includeIssues ? await githubClient.getIssues(owner, repo, parseInt(options.depth)) : [];
      const pullRequests = options.includePRs ? await githubClient.getPullRequests(owner, repo, parseInt(options.depth)) : [];
      const contributors = options.includeContributors ? await githubClient.getContributors(owner, repo, parseInt(options.depth)) : [];
      const commits = await githubClient.getCommits(owner, repo, parseInt(options.depth));

      console.log(chalk.green('✅ Data collection complete'));
      console.log(chalk.gray(`Found: ${issues.length} issues, ${pullRequests.length} PRs, ${contributors.length} contributors, ${commits.length} commits`));
      console.log();

      // Analyze health metrics
      console.log(chalk.yellow('🔍 Analyzing health metrics...'));
      
      const healthData = await analyzer.analyze({
        repository: repoData,
        issues,
        pullRequests,
        contributors,
        commits
      });

      // Generate and display report
      console.log(chalk.blue('📋 Project Health Report'));
      console.log('='.repeat(60));
      
      await reporter.generateReport(healthData, {
        showBenchmark: options.benchmark,
        showSecurity: options.includeSecurity,
        showBusFactor: options.includeBusFactor
      });

      // Save data if requested
      if (options.saveData) {
        await analyzer.saveToDatabase(healthData);
        console.log(chalk.green('💾 Data saved to local database'));
      }

      console.log();
      console.log(chalk.gray('Analysis complete! 🎉'));

    } catch (error) {
      console.error(chalk.red('❌ Analysis failed:'));
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program.parse();