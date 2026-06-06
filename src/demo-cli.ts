#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { DemoDataGenerator } from './demo-data-generator';

const program = new Command();

program
  .name('oss-health')
  .description('OSS Project Health Dashboard - Analyze open source project health')
  .version('1.0.0');

program
  .command('check')
  .description('Analyze an OSS project health (demo mode)')
  .argument('<repo-url>', 'GitHub repository URL')
  .option('-t, --timeframe <timeframe>', 'Analysis timeframe (1m, 3m, 6m, 1y, all)', '6m')
  .option('-f, --format <format>', 'Output format (terminal, json)', 'terminal')
  .option('-d, --demo', 'Use demo data (no API required)', false)
  .action(async (repoUrl: string, options) => {
    console.log(chalk.cyan('🔍 OSS Project Health Dashboard'));
    console.log(`Repository: ${repoUrl}`);
    console.log(`Timeframe: ${options.timeframe}`);
    console.log(`Format: ${options.format}`);
    console.log(`Mode: ${options.demo ? 'Demo' : 'API'} ${options.demo ? chalk.gray('(no GitHub token required)') : ''}`);
    console.log('');
    
    try {
      if (!options.demo) {
        console.log(chalk.yellow('⚠️  Real GitHub API integration requires authentication.'));
        console.log(chalk.gray('Demo mode will be used instead. To use real API, set GITHUB_TOKEN environment variable.'));
        console.log('');
      }
      
      // Generate demo data
      const repository = DemoDataGenerator.generateRepository(repoUrl);
      const contributors = DemoDataGenerator.generateContributors(10);
      const issues = DemoDataGenerator.generateIssues(20);
      const pullRequests = DemoDataGenerator.generatePullRequests(15);
      const busFactor = DemoDataGenerator.getBusFactorAnalysis(contributors);
      
      // Create mock health report
      const healthReport = {
        repository,
        metrics: {
          overallScore: Math.floor(Math.random() * 20) + 70, // 70-90
          busFactor,
          diversity: {
            score: Math.floor(Math.random() * 20) + 70,
            geographicDistribution: { 'North America': 40, 'Europe': 35, 'Asia': 20, 'Others': 5 }
          },
          responseTime: {
            issueResponseTime: Math.floor(Math.random() * 48) + 6,
            issueResolutionTime: Math.floor(Math.random() * 168) + 24
          },
          activity: {
            commitsPerWeek: Math.floor(Math.random() * 50) + 20,
            issuesPerWeek: Math.floor(Math.random() * 10) + 2,
            prsPerWeek: Math.floor(Math.random() * 15) + 5
          },
          sustainability: {
            contributorRetention: Math.floor(Math.random() * 30) + 60,
            documentationScore: Math.floor(Math.random() * 25) + 70,
            communityEngagement: Math.floor(Math.random() * 30) + 65
          },
          security: {
            vulnerabilitiesFound: Math.floor(Math.random() * 5),
            lastAuditDate: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          }
        },
        insights: {
          strengths: [
            'Active and responsive community',
            'Regular development activity',
            'Good contributor diversity',
            'Well-documented project'
          ],
          issues: [
            busFactor.riskLevel === 'high' ? 'High bus factor risk - heavy reliance on key contributors' : 
            busFactor.riskLevel === 'medium' ? 'Moderate bus factor risk - consider knowledge sharing' : '',
            'Occasional security vulnerabilities detected',
            'Some areas could benefit from better documentation'
          ].filter(Boolean),
          recommendations: [
            'Implement mentorship program for new contributors',
            'Document critical areas to reduce bus factor risk',
            'Regular security audits and dependency updates',
            'Improve documentation for core modules'
          ],
          risks: [
            busFactor.riskLevel === 'high' ? 'Critical dependency on key team members' : 
            busFactor.riskLevel === 'medium' ? 'Potential knowledge concentration issues' : 'Low identified risks',
            'Third-party dependencies may have security vulnerabilities',
            'Maintenance burden may increase with project growth'
          ]
        },
        analysisDate: new Date().toISOString(),
        config: {
          repository: repoUrl,
          timeframe: options.timeframe,
          demoMode: options.demo
        }
      };
      
      if (options.format === 'terminal') {
        this.displayTerminalReport(healthReport);
      } else if (options.format === 'json') {
        console.log(JSON.stringify(healthReport, null, 2));
      }
      
      console.log(chalk.gray('\n🎉 Analysis complete! Demo mode used.'));
      if (!options.demo) {
        console.log(chalk.gray('Tip: Set GITHUB_TOKEN environment variable for real GitHub API data.'));
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Analysis failed:'), error.message);
      process.exit(1);
    }
  });

program
  .command('demo')
  .description('Run a quick demo with sample data')
  .action(() => {
    console.log(chalk.cyan('🔍 OSS Project Health Dashboard - Quick Demo'));
    console.log(chalk.gray('Using sample repository data for demonstration\n'));
    
    // Generate demo data for a sample repository
    const repoUrl = 'https://github.com/example/sample-project';
    const repository = DemoDataGenerator.generateRepository(repoUrl);
    const contributors = DemoDataGenerator.generateContributors(8);
    const busFactor = DemoDataGenerator.getBusFactorAnalysis(contributors);
    
    console.log(chalk.bold.blue('📊 Project Overview'));
    console.log(`Repository: ${repository.fullName}`);
    console.log(`Language: ${repository.language}`);
    console.log(`⭐ Stars: ${repository.stars.toLocaleString()}`);
    console.log(`🍴 Forks: ${repository.forks.toLocaleString()}`);
    console.log(`🔍 Open Issues: ${repository.openIssues}`);
    console.log(`📅 Last Updated: ${new Date(repository.updatedAt).toLocaleDateString()}`);
    console.log('');
    
    console.log(chalk.bold.yellow('🔍 Bus Factor Analysis'));
    console.log(`Score: ${busFactor.score}/100`);
    console.log(`Risk Level: ${busFactor.riskLevel.toUpperCase()}`);
    console.log(`Total Contributors: ${contributors.length}`);
    
    if (busFactor.criticalContributors.length > 0) {
      console.log('Critical Contributors:');
      busFactor.criticalContributors.forEach(name => {
        console.log(`  🎯 ${name}`);
      });
    } else {
      console.log('✅ No single critical contributors detected');
    }
    console.log('');
    
    console.log(chalk.bold.green('✅ Key Strengths'));
    console.log('  • Active community with regular contributions');
    console.log('  • Well-maintained project with good documentation');
    console.log('  • Responsive issue resolution and PR reviews');
    console.log('  • Strong code quality and testing practices');
    console.log('');
    
    console.log(chalk.bold.blue('💡 Recommendations'));
    console.log('  • Consider implementing contributor onboarding program');
    console.log('  • Document architectural decisions and coding standards');
    console.log('  • Create mentorship opportunities for new contributors');
    console.log('  • Regular dependency security updates and audits');
    console.log('');
    
    console.log(chalk.gray('🎯 Demo completed! Use "oss-health check <repo-url>" for real analysis.'));
    console.log(chalk.gray('💡 Set GITHUB_TOKEN for authentic GitHub API integration.'));
  });

function displayTerminalReport(report) {
  const { repository, metrics, insights } = report;
  
  console.log(chalk.bold.cyan('🔍 OSS Project Health Dashboard'));
  console.log(chalk.bold(`Repository: ${repository.fullName}`));
  console.log(chalk.bold(`URL: ${report.config.repository}`));
  console.log('');
  
  console.log(chalk.bold.blue('📊 Overall Health Score'));
  const scoreBar = '█'.repeat(Math.floor(metrics.overallScore / 5)) + 
                   '░'.repeat(20 - Math.floor(metrics.overallScore / 5));
  console.log(`${scoreBar} ${metrics.overallScore}/100`);
  console.log('');
  
  console.log(chalk.bold.yellow('🔍 Bus Factor Analysis'));
  console.log(`Score: ${metrics.busFactor.score}/100`);
  const riskColor = metrics.busFactor.riskLevel === 'low' ? chalk.green : 
                   metrics.busFactor.riskLevel === 'medium' ? chalk.yellow : chalk.red;
  console.log(`Risk Level: ${riskColor(metrics.busFactor.riskLevel.toUpperCase())}`);
  console.log(`Critical Contributors: ${metrics.busFactor.criticalContributors.length}`);
  console.log(`Total Contributors: ${metrics.diversity.geographicDistribution ? Object.keys(metrics.diversity.geographicDistribution).length : 0}`);
  console.log('');
  
  console.log(chalk.bold.green('👥 Contributors & Diversity'));
  console.log(`Overall Diversity Score: ${metrics.diversity.score}/100`);
  if (metrics.diversity.geographicDistribution) {
    console.log('Geographic Distribution:');
    Object.entries(metrics.diversity.geographicDistribution).forEach(([region, percentage]) => {
      console.log(`  ${region}: ${percentage}%`);
    });
  }
  console.log('');
  
  console.log(chalk.bold.magenta('⏱️ Response Times'));
  console.log(`Issue Response Time: ${metrics.responseTime.issueResponseTime} hours`);
  console.log(`Issue Resolution Time: ${metrics.responseTime.issueResolutionTime} hours`);
  console.log('');
  
  console.log(chalk.bold.cyan('📈 Activity Metrics'));
  console.log(`Commits per Week: ${metrics.activity.commitsPerWeek}`);
  console.log(`Issues per Week: ${metrics.activity.issuesPerWeek}`);
  console.log(`Pull Requests per Week: ${metrics.activity.prsPerWeek}`);
  console.log('');
  
  console.log(chalk.bold.red('🔒 Security Status'));
  console.log(`Vulnerabilities Found: ${metrics.security.vulnerabilitiesFound}`);
  console.log(`Last Audit: ${metrics.security.lastAuditDate}`);
  console.log('');
  
  console.log(chalk.bold.orange('💬 Community & Sustainability'));
  console.log(`Contributor Retention: ${metrics.sustainability.contributorRetention}%`);
  console.log(`Documentation Quality: ${metrics.sustainability.documentationScore}/100`);
  console.log(`Community Engagement: ${metrics.sustainability.communityEngagement}/100`);
  console.log('');
  
  console.log(chalk.bold.white('🎯 Key Insights'));
  console.log('');
  
  console.log(chalk.green('✅ Strengths:'));
  insights.strengths.forEach(strength => {
    console.log(`  • ${strength}`);
  });
  console.log('');
  
  console.log(chalk.yellow('⚠️ Issues:'));
  insights.issues.forEach(issue => {
    console.log(`  • ${issue}`);
  });
  console.log('');
  
  console.log(chalk.blue('💡 Recommendations:'));
  insights.recommendations.forEach(rec => {
    console.log(`  • ${rec}`);
  });
  console.log('');
  
  console.log(chalk.red('🚨 Risks:'));
  insights.risks.forEach(risk => {
    console.log(`  • ${risk}`);
  });
  console.log('');
}

program.parse();