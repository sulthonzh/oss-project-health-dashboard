#!/usr/bin/env node

// Quick test script for demo CLI
import { Command } from 'commander';
import chalk from 'chalk';
import { DemoDataGenerator } from './src/demo-data-generator.js';

const program = new Command();

program
  .name('oss-health-demo')
  .description('OSS Project Health Dashboard - Quick Demo Test')
  .version('1.0.0');

program
  .command('quick')
  .description('Quick demo with sample data')
  .action(() => {
    console.log(chalk.cyan('🔍 OSS Project Health Dashboard - Quick Test'));
    console.log('');
    
    const repoData = DemoDataGenerator.generateRepository('https://github.com/test/example');
    console.log(chalk.bold.blue('📊 Repository:'), repoData.fullName);
    console.log(chalk.yellow('⭐ Stars:'), repoData.stars.toLocaleString());
    console.log(chalk.green('🍴 Forks:'), repoData.forks);
    console.log(chalk.magenta('🔍 Issues:'), repoData.openIssues);
    console.log('');
    
    const contributors = DemoDataGenerator.generateContributors(5);
    console.log(chalk.bold('👥 Top Contributors:'));
    contributors.slice(0, 3).forEach((c, i) => {
      console.log(`${i + 1}. ${c.name} - ${c.contributions} commits`);
    });
    console.log('');
    
    console.log(chalk.gray('✅ Demo CLI working! Ready for production deployment.'));
  });

program.parse();