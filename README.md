# OSS Project Health Dashboard

[![npm version](https://badge.fury.io/js/oss-project-health-dashboard.svg)](https://badge.fury.io/js/oss-project-health-dashboard)
[![Build Status](https://github.com/sulthonzh/oss-project-health-dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/sulthonzh/oss-project-health-dashboard/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Is your open-source project one person away from dying?** Get a full health report — bus factor, contributor diversity, response times, security posture — in one command. No dashboards to configure, no agents to install.

## 🚀 Features

- **One-Command Analysis**: Get comprehensive health metrics with a single command
- **Bus Factor Analysis**: Identify critical contributors and project risk
- **Diversity Metrics**: Track contributor diversity and geographic distribution
- **Response Time Analysis**: Monitor issue and PR response times
- **Activity Tracking**: Analyze commit velocity, PR frequency, and engagement
- **Sustainability Indicators**: Assess long-term project health and maintenance
- **Security Analysis**: Dependency health and vulnerability detection
- **Multiple Output Formats**: Table, JSON, and web dashboard options
- **Data Persistence**: Save analysis data to local database
- **Benchmarking**: Compare against similar projects

## 📊 Health Metrics

The dashboard analyzes six key health dimensions:

1. **Overall Health Score**: Weighted score from 0-100
2. **Bus Factor**: Risk assessment based on contributor concentration
3. **Diversity**: Geographic and experiential diversity metrics
4. **Response Time**: Average response and resolution times
5. **Activity**: Commit and contribution velocity trends
6. **Sustainability**: Long-term project health indicators
7. **Security**: Dependency security and compliance

## 🛠️ Installation

```bash
npm install -g oss-project-health-dashboard
```

## 🎯 Usage

### Basic Analysis

```bash
oss-health-check facebook/react
```

### Advanced Options

```bash
oss-health-check facebook/react \
  --depth 12 \
  --output json \
  --include-bus-factor \
  --include-security \
  --save-data \
  --benchmark
```

### With GitHub Token (for higher rate limits)

```bash
oss-health-check facebook/react --token YOUR_GITHUB_TOKEN
```

## 🔧 Command Options

| Option | Description | Default |
|--------|-------------|---------|
| `<repo-url>` | GitHub repository URL (required) | - |
| `-d, --depth` | Analysis depth in months | 6 |
| `-t, --token` | GitHub personal access token | env:GITHUB_TOKEN |
| `-o, --output` | Output format (table|json|web) | table |
| `--include-issues` | Include issue analysis | true |
| `--include-prs` | Include pull request analysis | true |
| `--include-contributors` | Include detailed contributor analysis | true |
| `--include-bus-factor` | Include bus factor analysis | true |
| `--include-security` | Include security analysis | true |
| `--save-data` | Save analysis data to local database | false |
| `--benchmark` | Show benchmark against similar projects | false |

## 📈 Example Output

```
🚀 OSS Project Health Dashboard
Analyzing: facebook/react

📋 Project Health Report
============================================================
🎯 Overall Health Score: 85/100

┌─────────────────┬───────┬───────────────┐
│ Metric          │ Score │ Status        │
├─────────────────┼───────┼───────────────┤
│ Bus Factor      │ 78    │ ⚠️  Good      │
│ Diversity       │ 92    │ ✅ Excellent  │
│ Response Time   │ 85    │ ✅ Excellent  │
│ Activity        │ 88    │ ✅ Excellent  │
│ Sustainability  │ 82    │ ✅ Excellent  │
└─────────────────┴───────┴───────────────┘

📊 Repository Information
┌─────────────┬─────────────────────────────────────────────┐
│ Property    │ Value                                       │
├─────────────┼─────────────────────────────────────────────┤
│ Name        │ react                                       │
│ Description │ A declarative, efficient, and flexible     │
│ Language    │ JavaScript                                 │
│ Stars       │ 214,567                                    │
│ Forks       │ 43,892                                     │
│ Open Issues │ 856                                        │
│ License     │ MIT                                        │
└─────────────┴─────────────────────────────────────────────┘

🚨 Bus Factor Analysis
┌────────────────┬─────────┬────────────┐
│ Contributor    │ Commits │ Risk       │
├────────────────┼─────────┼────────────┤
| dan Abramov    │ 1,234   │ 🟡 Medium  │
| Sebastian Mark│ 987     │ 🟡 Medium  │
| Andrew Clark   │ 765     │ 🟢 Low     │
└────────────────┴─────────┴────────────┘

💡 Key Insights
• High activity levels - healthy project engagement
• Contributor diversity is excellent
• Response times could be improved for community issues

🎯 Recommendations
1. Implement response time SLAs for maintainers
2. Consider mentorship program for new contributors
3. Document architecture and critical areas
```

## 🔧 Configuration

Create a `oss-health-config.json` file:

```json
{
  "githubToken": "your-github-token",
  "defaultDepth": 12,
  "outputFormat": "table",
  "databasePath": "./health-data.db"
}
```

## 🗄️ Database Storage

The dashboard can save analysis data to a local SQLite database for historical tracking:

```bash
oss-health-check facebook/react --save-data
```

Data is stored with timestamps and can be used for trend analysis over time.

## 📊 API Usage

For programmatic use:

```typescript
import { GitHubClient, HealthAnalyzer } from 'oss-project-health-dashboard';

const client = new GitHubClient('your-token');
const analyzer = new HealthAnalyzer(12);

const data = await analyzer.analyze({
  repository: await client.getRepository('facebook', 'react'),
  issues: await client.getIssues('facebook', 'react', 12),
  pullRequests: await client.getPullRequests('facebook', 'react', 12),
  contributors: await client.getContributors('facebook', 'react', 12),
  commits: await client.getCommits('facebook', 'react', 12)
});
```

## 🔄 How It Compares

| Feature | oss-health-check | Octoclairvoyant | Repo Health Checker | GitHub Insights |
|---------|-----------------|-----------------|--------------------|----------------|
| Bus factor scoring | ✅ | ❌ | ❌ | ❌ |
| Contributor diversity | ✅ | ❌ | Partial | ❌ |
| CLI (no UI needed) | ✅ | ❌ | ✅ | ❌ |
| JSON output for pipelines | ✅ | ❌ | Partial | ❌ |
| Works offline (demo mode) | ✅ | ❌ | ❌ | ❌ |
| Multi-repo batch | ✅ Enterprise | ❌ | ❌ | Partial |
| Price | Free | Free | Free | Paid |

## 🎯 Real-World Examples

### 1. Pre-acquisition due diligence
Assess a project's health before depending on it:
```bash
oss-health-check facebook/react --depth 12 --output json > react-health.json
```
Get bus factor, response times, and sustainability — the same metrics a VC would want.

### 2. Monthly team review
Generate a markdown report for your team's monthly architecture review:
```bash
oss-health-check yourorg/your-repo --output markdown --depth 1 --save-data > monthly-report.md
```
Track trends month-over-month with `--save-data` building a historical baseline.

### 3. CI/CD quality gate
Fail CI when project health drops below threshold:
```bash
SCORE=$(oss-health-check yourorg/critical-repo --output json | jq '.metrics.overallScore')
[ "$SCORE" -lt 70 ] && echo "Health score dropped below 70!" && exit 1
```

### More scenarios

```bash
# Bus factor deep-dive
oss-health-check microsoft/vscode --include-bus-factor

# Security audit for last quarter
oss-health-check npm/cli --include-security --depth 3

# Community engagement check
oss-health-check nodejs/node --include-contributors
```

## 🔍 Health Metrics Explained

### Bus Factor
Measures project risk based on contributor concentration. High scores indicate low risk with distributed knowledge.

### Diversity
Tracks geographic and experiential diversity. Important for sustainable communities and fresh perspectives.

### Response Time
Average time from issue/PR creation to first response and resolution. Critical for community health.

### Activity
Measures engagement through commit and PR frequency. Indicates project momentum and contributor investment.

### Sustainability
Long-term health indicators including contributor retention, backlog management, and maintenance index.

### Security
Dependency health, vulnerability detection, and license compliance assessment.

## 🏢 Enterprise Features

### Multi-Repo Analysis

Analyze multiple repositories with consolidated reporting and threshold-based filtering:

```bash
oss-health-check-enterprise multi-repo repositories.txt \
  --output dashboard \
  --threshold 70 \
  --include-trends \
  --include-recommendations \
  --export-format json \
  --export-path ./reports/
```

Create a repository list file:

```text
# repositories.txt
https://github.com/owner/repo1
https://github.com/owner/repo2
https://github.com/org/team-repo
# Comment lines are ignored
```

### Continuous Monitoring

Set up automated health monitoring with real-time alerts:

```bash
oss-health-check-enterprise monitor https://github.com/owner/critical-repo \
  --interval 24 \
  --threshold 70 \
  --alert-slack https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

### Benchmark Analysis

Compare projects against industry standards and similar repositories:

```bash
oss-health-check-enterprise benchmark https://github.com/owner/my-project \
  --category web-development \
  --limit 10 \
  --include-metrics bus-factor,diversity,response-time
```

### CI/CD Integration

Automate deployment with GitHub Actions workflows:

- Automated testing and security scanning
- Multi-environment deployments
- Version management and releases
- Performance monitoring and alerts

## 🚀 Development

```bash
git clone https://github.com/sulthonzh/oss-project-health-dashboard.git
cd oss-project-health-dashboard
npm install
npm run build
npm test
npm run enterprise  # Test enterprise features
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- test/enterprise-cli.test.ts
```

## 📊 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📈 Roadmap

### Core Features
- [ ] Web dashboard interface
- [ ] GitHub App integration
- [ ] Slack/Teams notifications
- [ ] Historical trend analysis
- [ ] Custom metric definitions
- [ ] Team collaboration features
- [ ] Advanced security scanning

### Enterprise Features
- [ ] Multi-tenant support
- [ ] Organization-wide health dashboards
- [ ] Advanced alerting and notifications
- [ ] API key management
- [ ] SSO integration
- [ ] Audit logging and compliance
- [ ] Advanced reporting and analytics
- [ ] Third-party integrations (Jira, GitLab, Bitbucket)

---

Built with ❤️ for the open source community