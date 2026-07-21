# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-07-22

### Fixed
- Corrected version mismatch between `package.json` (1.3.0) and CLI `--version` output (was 1.2.0)

### Changed
- Clarified `saveToDatabase` as intentional no-op (SQLite persistence planned for v2.0)
- Improved README description for clarity and impact

### Tests
- Added edge-case tests: empty contributors, zero stars, saveToDatabase no-op
- Branch coverage improved from 91.17% → 93.45%
- Function coverage improved from 97.05% → 100%
- Total tests: 34 (was 31)
