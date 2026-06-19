#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { DemoDataGenerator } from './demo-data-generator';

const program = new Command();

program
  .name('oss-health')
  .description('OSS Project Health Dashboard - Analyze open source project health')
  .version('1.1.0');

program
  .command('demo')
  .description('Run a demo with mock data')
  .option('-f, --format <format>', 'Output format (terminal, json)', 'terminal')
  .action(async (options) => {
    console.log(chalk.cyan('🔍 OSS Project Health Dashboard - Demo Mode'));
    console.log(chalk.gray('(Using mock data - no GitHub API required)'));
    console.log('');
    
    try {
      const generator = new DemoDataGenerator();
      
      console.log(chalk.yellow('📊 Generating demo data...'));
       
      const mockData = {
        repository: DemoDataGenerator.generateRepository('facebook/react'),
        issues: DemoDataGenerator.generateIssues(25),
        pullRequests: DemoDataGenerator.generatePullRequests(15),
        contributors: DemoDataGenerator.generateContributors(8),
        commits: Array.from({ length: 100 }, (_, i) => ({
          sha: `abc${123 + i}`,
          message: `Fix issue #${i + 1}\n\nThis is a commit message for issue ${i + 1}`,
          author: `user${i % 5}`,
          date: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
          additions: Math.floor(Math.random() * 100),
          deletions: Math.floor(Math.random() * 50),
          files: Math.floor(Math.random() * 10) + 1
        })),
        analysisDepth: 6
      };
      
      console.log(chalk.green('✅ Demo data generated successfully'));
      console.log(chalk.gray(`Repository: ${mockData.repository.fullName}`));
      console.log(chalk.gray(`Analysis period: ${mockData.analysisDepth} months`));
      console.log(chalk.gray(`Issues: ${mockData.issues.length}, PRs: ${mockData.pullRequests.length}, Contributors: ${mockData.contributors.length}, Commits: ${mockData.commits.length}`));
      console.log('');
      
      const healthScore = Math.floor(Math.random() * 20) + 75; // 75-95
      const busFactorScore = Math.floor(Math.random() * 20) + 70; // 70-90
      
      console.log(chalk.blue('📋 Project Health Report'));
      console.log('='.repeat(60));
      
      if (options.format === 'terminal') {
        console.log(chalk.green('📊 Overall Health Score'));
        const progress = '█'.repeat(Math.floor(healthScore / 5)) + '░'.repeat(20 - Math.floor(healthScore / 5));
        console.log(`${progress} ${healthScore}/100`);
        console.log('');
        
        console.log(chalk.yellow('🔍 Bus Factor Analysis'));
        console.log(`Score: ${busFactorScore}/100`);
        console.log(`Risk Level: ${busFactorScore > 80 ? 'LOW' : busFactorScore > 60 ? 'MEDIUM' : 'HIGH'}`);
        console.log(`Critical Contributors: ${Math.floor(Math.random() * 3) + 1}`);
        console.log(`Total Contributors: ${mockData.contributors.length}`);
        console.log('');
        
        console.log(chalk.green('✅ Strengths:'));
        console.log('  • Active community engagement');
        console.log('  • Good response times for issues');
        console.log('  • Well-maintained project documentation');
        console.log('');
        
        console.log(chalk.yellow('⚠️ Issues:'));
        console.log('  • Moderate bus factor risk');
        console.log('  • Some areas need documentation updates');
        console.log('');
        
        console.log(chalk.blue('💡 Recommendations:'));
        console.log('  • Document critical areas to reduce bus factor risk');
        console.log('  • Implement mentorship program for new contributors');
        console.log('  • Regular dependency security audits');
        console.log('');
        
        console.log(chalk.red('🚨 Risks:'));
        console.log('  • Knowledge concentration in few contributors');
        console.log('  • Potential bottleneck during release cycles');
        console.log('');
        
      } else if (options.format === 'json') {
        const report = {
          repository: mockData.repository,
          metrics: {
            overallScore: healthScore,
            busFactor: {
              score: busFactorScore,
              riskLevel: busFactorScore > 80 ? 'low' : busFactorScore > 60 ? 'medium' : 'high'
            }
          },
          insights: {
            strengths: ['Active community', 'Good response times', 'Well-maintained'],
            issues: ['Moderate bus factor risk', 'Documentation needs updates'],
            recommendations: ['Document critical areas', 'Implement mentorship program', 'Regular security audits'],
            risks: ['Knowledge concentration', 'Potential bottleneck']
          },
          analysis: {
            timeframe: `${mockData.analysisDepth} months`,
            issuesAnalyzed: mockData.issues.length,
            pullRequestsAnalyzed: mockData.pullRequests.length,
            contributorsAnalyzed: mockData.contributors.length,
            commitsAnalyzed: mockData.commits.length
          }
        };
        
        console.log(JSON.stringify(report, null, 2));
      }
      
      console.log();
      console.log(chalk.gray('Demo completed successfully! 🎉'));
      console.log(chalk.gray('For full functionality with real GitHub data, provide a GitHub token.'));
      
    } catch (error) {
      console.error(chalk.red('❌ Demo failed:'));
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program.parse();