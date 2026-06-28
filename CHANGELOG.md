# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-06-28

### Added
- ESLint flat config with typescript-eslint (zero errors, zero warnings)
- c8 coverage reporting (`npm run test:coverage`)
- Coverage: 94.76% statements, 78.08% branches, 95.23% functions
- Lint script (`npm run lint`) wired to ESLint

### Fixed
- TypeScript tsconfig.json: added `types: ["node"]`, upgraded target to ES2022, removed deprecated `baseUrl`/`paths`/`experimentalDecorators`/`emitDecoratorMetadata`
- Removed unused `DashboardReporter` import from enterprise-cli.ts
- Removed unused `generator` variable in demo-cli.ts
- Removed unused `criticalThreshold` variable in health-analyzer.ts
- Removed unused `openIssues`/`openPRs` variables in health-analyzer.ts
- Prefixed unused params with underscore (`_pullRequests`, `_healthData`, `_options`, `_previousScore`)
- Fixed `prefer-const` violations in enterprise-cli.ts
- Fixed uninitiated const declaration in enterprise-cli.ts

### Changed
- Updated `moduleResolution` from deprecated `node` to `node10` with `ignoreDeprecations: 6.0`
- ESLint config relaxed `no-explicit-any` for CLI tool (commander options are inherently untyped)

## [1.2.0] - 2026-06-19

### Fixed
- Removed lingering `date-fns` references from build scripts (dependency was already eliminated)
- Fixed TypeScript strict-mode errors in `github-client.ts` (TS2339, TS2322, TS2677)
- Resolved Octokit type mismatches for `pulls.list` response (comments/additions/deletions/changed_files)
- Fixed `listCommits` parameter type (`since` expects ISO string, not Date object)
- Fixed contributor type predicate that was incompatible with Octokit's contributor shape

### Changed
- Version bumped to 1.2.0 across CLI entry points
- Contributor mapping refactored from `filter`+`map` to a simple loop for type safety

## [1.1.0] - 2026-06-19

### Added
- `HealthData` interface for structured health report output
- Deterministic security scoring algorithm
- `exports`, `files`, `engines`, and `prepublishOnly` fields in `package.json`

### Changed
- Removed `date-fns` dependency — replaced with native date arithmetic
- Consolidated metric access patterns (no more double `.metrics` chaining)

### Fixed
- Corrected `HealthMetrics` export to match the actual interface name

## [1.0.0] - 2026-06-18

### Added
- Initial release
- GitHub repository health analysis (issues, PRs, contributors, commits)
- Bus factor calculation with risk assessment
- Contributor diversity scoring
- Response time and engagement metrics
- Terminal table, JSON, and Markdown output formats
- Demo mode with mock data (no GitHub token required)
- Configurable analysis depth (months)
- Enterprise CLI with batch analysis support
