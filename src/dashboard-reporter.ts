import chalk from 'chalk';
import { Table } from 'cli-table3';
import { HealthData, HealthMetrics } from './github-client';
import { format } from 'date-fns';

export interface ReportOptions {
  showBenchmark: boolean;
  showSecurity: boolean;
  showBusFactor: boolean;
}

export class DashboardReporter {
  private outputFormat: 'table' | 'json' | 'markdown' | 'web';

  constructor(outputFormat: 'table' | 'json' | 'markdown' | 'web' = 'table') {
    this.outputFormat = outputFormat;
  }

  async generateReport(healthData: HealthData, options: ReportOptions): Promise<void> {
    switch (this.outputFormat) {
      case 'json':
        this.generateJsonReport(healthData);
        break;
      case 'markdown':
        console.log(this.toMarkdown(healthData, options));
        break;
      case 'web':
        this.generateWebReport(healthData, options);
        break;
      default:
        this.generateTableReport(healthData, options);
    }
  }

  private generateTableReport(healthData: HealthData, options: ReportOptions): void {
    const { metrics, repository, insights, recommendations } = healthData;

    console.log(chalk.bold.cyan(repository.fullName));
    console.log(chalk.gray(`Analysis Date: ${format(new Date(healthData.analysisDate), 'PPP')}`));
    console.log(chalk.gray(`Analysis Depth: ${healthData.analysisDepth} months`));
    console.log();

    const scoreColor = metrics.overallScore >= 80 ? chalk.green : 
                     metrics.overallScore >= 60 ? chalk.yellow : chalk.red;
    console.log(scoreColor.bold(`🎯 Overall Health Score: ${metrics.overallScore}/100`));
    console.log();

    const statsTable = new Table({
      head: [chalk.cyan('Metric'), chalk.cyan('Score'), chalk.cyan('Status')],
      colWidths: [30, 10, 20]
    });

    statsTable.push(
      ['Bus Factor', metrics.busFactor.score, this.getStatusEmoji(metrics.busFactor.score)],
      ['Diversity', metrics.diversity.score, this.getStatusEmoji(metrics.diversity.score)],
      ['Response Time', metrics.responseTime.score, this.getStatusEmoji(metrics.responseTime.score)],
      ['Activity', metrics.activity.score, this.getStatusEmoji(metrics.activity.score)],
      ['Sustainability', metrics.metrics.sustainability.score, this.getStatusEmoji(metrics.metrics.sustainability.score)]
    );

    if (options.showSecurity) {
      statsTable.push(
        ['Security', metrics.security.score, this.getStatusEmoji(metrics.security.score)]
      );
    }

    console.log(statsTable.toString());
    console.log();

    if (options.showBusFactor) {
      console.log(chalk.bold.yellow('🚨 Bus Factor Analysis'));
      const busFactorTable = new Table({
        head: [chalk.cyan('Contributor'), chalk.cyan('Commits'), chalk.cyan('Risk')],
        colWidths: [25, 10, 15]
      });

      metrics.busFactor.distribution.forEach((count, author) => {
        const riskLevel = this.getBusFactorRiskColor(metrics.busFactor.riskLevel);
        busFactorTable.push([author, count.toString(), riskLevel(metrics.busFactor.riskLevel)]);
      });

      console.log(busFactorTable.toString());
      console.log(chalk.gray(`Critical Contributors: ${metrics.busFactor.criticalContributors.join(', ')}`));
      console.log(chalk.gray(`Risk Level: ${metrics.busFactor.riskLevel}`));
      console.log();
    }

    console.log(chalk.bold.blue('📊 Repository Information'));
    const repoTable = new Table({
      head: [chalk.cyan('Property'), chalk.cyan('Value')],
      colWidths: [20, 50]
    });

    repoTable.push(
      ['Name', repository.name],
      ['Description', repository.description],
      ['Language', repository.language],
      ['Stars', repository.stars.toString()],
      ['Forks', repository.forks.toString()],
      ['Open Issues', repository.openIssues.toString()],
      ['License', repository.license],
      ['Topics', repository.topics.join(', ') || 'None']
    );

    console.log(repoTable.toString());
    console.log();

    console.log(chalk.bold.green('📈 Activity Metrics'));
    const activityTable = new Table({
      head: [chalk.cyan('Metric'), chalk.cyan('Value')],
      colWidths: [25, 30]
    });

    activityTable.push(
      ['Commit Velocity', `${metrics.activity.commitVelocity.toFixed(1)} commits/month`],
      ['PR Velocity', `${metrics.activity.prVelocity.toFixed(1)} PRs/month`],
      ['Issue Velocity', `${metrics.activity.issueVelocity.toFixed(1)} issues/month`],
      ['Contributor Trend', metrics.activity.contributorTrend]
    );

    console.log(activityTable.toString());
    console.log();

    console.log(chalk.bold.magenta('⏱️ Response Time Analysis'));
    const responseTable = new Table({
      head: [chalk.cyan('Metric'), chalk.cyan('Hours')],
      colWidths: [25, 20]
    });

    responseTable.push(
      ['Average Response', metrics.responseTime.averageResponseTime.toFixed(1)],
      ['Issue Response', metrics.responseTime.issueResponseTime.toFixed(1)],
      ['PR Resolution', metrics.responseTime.prResponseTime.toFixed(1)]
    );

    console.log(responseTable.toString());
    console.log();

    console.log(chalk.bold.orange('🌱 Sustainability Metrics'));
    const sustainabilityTable = new Table({
      head: [chalk.cyan('Metric'), chalk.cyan('Value')],
      colWidths: [25, 30]
    });

    sustainabilityTable.push(
      ['Issue Backlog', metrics.metrics.sustainability.issueBacklog.toString()],
      ['PR Merge Rate', `${(metrics.metrics.sustainability.prMergeRate * 100).toFixed(1)}%`],
      ['Contributor Retention', `${(metrics.metrics.sustainability.contributorRetention * 100).toFixed(1)}%`],
      ['Maintenance Index', metrics.metrics.sustainability.maintenanceIndex.toString()]
    );

    console.log(sustainabilityTable.toString());
    console.log();

    if (options.showSecurity) {
      console.log(chalk.bold.red('🔒 Security Analysis'));
      const securityTable = new Table({
        head: [chalk.cyan('Metric'), chalk.cyan('Value')],
        colWidths: [25, 30]
      });

      securityTable.push(
        ['Dependency Health', this.getSecurityHealthColor(metrics.security.dependencyHealth)(metrics.security.dependencyHealth)],
        ['Vulnerability Count', metrics.security.vulnerabilityCount.toString()],
        ['License Compliance', metrics.security.licenseCompliance ? '✅' : '❌']
      );

      console.log(securityTable.toString());
      console.log();
    }

    if (insights.length > 0) {
      console.log(chalk.bold.yellow('💡 Key Insights'));
      insights.forEach(insight => {
        console.log(chalk.gray(`• ${insight}`));
      });
      console.log();
    }

    if (recommendations.length > 0) {
      console.log(chalk.bold.blue('🎯 Recommendations'));
      recommendations.forEach((recommendation, index) => {
        console.log(chalk.gray(`${index + 1}. ${recommendation}`));
      });
      console.log();
    }

    console.log(chalk.gray('Status Legend:'));
    console.log(chalk.green('✅ Excellent (80-100)'));
    console.log(chalk.yellow('⚠️  Good (60-79)'));
    console.log(chalk.red('❌ Needs Improvement (0-59)'));
  }

  toMarkdown(healthData: HealthData, options: ReportOptions): string {
    const { metrics, repository, insights, recommendations } = healthData;
    const lines: string[] = [];

    const statusLabel = (score: number) => score >= 80 ? '✅' : score >= 60 ? '⚠️' : '❌';

    lines.push(`# ${repository.fullName} — Health Report`);
    lines.push('');
    lines.push(`- **Analyzed:** ${new Date(healthData.analysisDate).toISOString().split('T')[0]}`);
    lines.push(`- **Depth:** ${healthData.analysisDepth} months`);
    lines.push('');

    lines.push(`## Overall Score: ${metrics.overallScore}/100 ${statusLabel(metrics.overallScore)}`);
    lines.push('');

    lines.push('## Metric Scores');
    lines.push('');
    lines.push('| Metric | Score | Status |');
    lines.push('|--------|------:|--------|');
    lines.push(`| Bus Factor | ${metrics.busFactor.score} | ${statusLabel(metrics.busFactor.score)} |`);
    lines.push(`| Diversity | ${metrics.diversity.score} | ${statusLabel(metrics.diversity.score)} |`);
    lines.push(`| Response Time | ${metrics.responseTime.score} | ${statusLabel(metrics.responseTime.score)} |`);
    lines.push(`| Activity | ${metrics.activity.score} | ${statusLabel(metrics.activity.score)} |`);
    lines.push(`| Sustainability | ${metrics.sustainability.score} | ${statusLabel(metrics.sustainability.score)} |`);
    if (options.showSecurity) {
      lines.push(`| Security | ${metrics.security.score} | ${statusLabel(metrics.security.score)} |`);
    }
    lines.push('');

    if (options.showBusFactor) {
      lines.push('## Bus Factor');
      lines.push('');
      lines.push(`**Risk Level:** ${metrics.busFactor.riskLevel} | **Critical Contributors:** ${metrics.busFactor.criticalContributors.join(', ') || 'None'}`);
      lines.push('');
      if (Object.keys(metrics.busFactor.distribution).length > 0) {
        lines.push('| Contributor | Commits |');
        lines.push('|-------------|--------:|');
        for (const [author, count] of Object.entries(metrics.busFactor.distribution)) {
          lines.push(`| ${author} | ${count} |`);
        }
        lines.push('');
      }
    }

    lines.push('## Repository');
    lines.push('');
    lines.push(`| Property | Value |`);
    lines.push(`|----------|-------|`);
    lines.push(`| Language | ${repository.language} |`);
    lines.push(`| Stars | ${repository.stars} |`);
    lines.push(`| Forks | ${repository.forks} |`);
    lines.push(`| Open Issues | ${repository.openIssues} |`);
    lines.push(`| License | ${repository.license || 'None'} |`);
    lines.push(`| Topics | ${repository.topics.join(', ') || 'None'} |`);
    lines.push('');

    lines.push('## Activity');
    lines.push('');
    lines.push(`| Metric | Value |`);
    lines.push(`|--------|------|`);
    lines.push(`| Commit Velocity | ${metrics.activity.commitVelocity.toFixed(1)} commits/month |`);
    lines.push(`| PR Velocity | ${metrics.activity.prVelocity.toFixed(1)} PRs/month |`);
    lines.push(`| Issue Velocity | ${metrics.activity.issueVelocity.toFixed(1)} issues/month |`);
    lines.push(`| Contributor Trend | ${metrics.activity.contributorTrend} |`);
    lines.push('');

    lines.push('## Response Time');
    lines.push('');
    lines.push(`| Metric | Hours |`);
    lines.push(`|--------|------:|`);
    lines.push(`| Average Response | ${metrics.responseTime.averageResponseTime.toFixed(1)} |`);
    lines.push(`| Issue Response | ${metrics.responseTime.issueResponseTime.toFixed(1)} |`);
    lines.push(`| PR Resolution | ${metrics.responseTime.prResponseTime.toFixed(1)} |`);
    lines.push('');

    lines.push('## Sustainability');
    lines.push('');
    lines.push(`| Metric | Value |`);
    lines.push(`|--------|------|`);
    lines.push(`| Issue Backlog | ${metrics.sustainability.issueBacklog} |`);
    lines.push(`| PR Merge Rate | ${(metrics.sustainability.prMergeRate * 100).toFixed(1)}% |`);
    lines.push(`| Contributor Retention | ${(metrics.sustainability.contributorRetention * 100).toFixed(1)}% |`);
    lines.push(`| Maintenance Index | ${metrics.sustainability.maintenanceIndex} |`);
    lines.push('');

    if (options.showSecurity) {
      lines.push('## Security');
      lines.push('');
      lines.push(`| Metric | Value |`);
      lines.push(`|--------|------|`);
      lines.push(`| Dependency Health | ${metrics.security.dependencyHealth} |`);
      lines.push(`| Vulnerabilities | ${metrics.security.vulnerabilityCount} |`);
      lines.push(`| License Compliance | ${metrics.security.licenseCompliance ? '✅' : '❌'} |`);
      lines.push('');
    }

    if (insights.length > 0) {
      lines.push('## Insights');
      lines.push('');
      insights.forEach(i => lines.push(`- ${i}`));
      lines.push('');
    }

    if (recommendations.length > 0) {
      lines.push('## Recommendations');
      lines.push('');
      recommendations.forEach((r, i) => lines.push(`${i + 1}. ${r}`));
      lines.push('');
    }

    return lines.join('\n');
  }

  private generateJsonReport(healthData: HealthData): void {
    console.log(JSON.stringify(healthData, null, 2));
  }

  private generateWebReport(healthData: HealthData, options: ReportOptions): void {
    // Simplified web report - in production, this would generate HTML
    console.log('Web report generation not implemented yet. Using table format instead.');
    this.generateTableReport(healthData, options);
  }

  private getStatusEmoji(score: number): string {
    if (score >= 80) return '✅ Excellent';
    if (score >= 60) return '⚠️  Good';
    return '❌ Needs Improvement';
  }

  private getBusFactorRiskColor(riskLevel: string): (text: string) => string {
    switch (riskLevel) {
      case 'high': return chalk.red.bold;
      case 'medium': return chalk.yellow.bold;
      case 'low': return chalk.green.bold;
      default: return chalk.white;
    }
  }

  private getSecurityHealthColor(health: string): (text: string) => string {
    switch (health) {
      case 'good': return chalk.green.bold;
      case 'warning': return chalk.yellow.bold;
      case 'critical': return chalk.red.bold;
      default: return chalk.white;
    }
  }
}