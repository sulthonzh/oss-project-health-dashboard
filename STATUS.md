# oss-project-health-dashboard - Audit Status

## Last Audited
2026-06-19

## Audit Findings

### Source Code Fixes Applied (staged, not pushed)
1. **Removed date-fns dependency** — Unused import in dashboard-reporter.ts, replaced `format()` call with `toLocaleDateString()`. Also removed unused import from health-analyzer.ts.
2. **Fixed double .metrics property access** — `metrics.metrics.sustainability.score` → `metrics.sustainability.score` in dashboard-reporter.ts.
3. **Added HealthData interface** — Was imported in dashboard-reporter.ts and health-analyzer.ts but not defined/exported from github-client.ts. Added full interface definition.
4. **Fixed non-deterministic security scoring** — `calculateSecurity()` used `Math.random()` for vulnerability counts. Replaced with deterministic heuristics based on repository popularity.
5. **Rewrote test files** — types.test.ts and index.test.ts were completely broken (imported phantom types, used jest.Mocked with vitest, referenced non-existent functions). Rewrote to match actual codebase types and vitest API.

### Issues Identified
1. **Vitest/esbuild version mismatch** — Host esbuild (v0.21.5) doesn't match binary version (v0.27.7). Tests cannot run. Needs fresh `npm install` or env cleanup.
2. **README needs improvement** — First lines are generic, missing 3 real-world examples, no comparison table vs alternatives.
3. **Heavy dependency footprint** — 6 runtime dependencies (octokit, chalk, cli-table3, commander, ora, date-fns). Not zero-dep like polished tools.
4. **TODO/FIXME** — None found in source code ✓

### Test Status
- Tests cannot run due to vitest/esbuild version mismatch
- Test files rewritten to match actual types:
  - types.test.ts: Now tests BusFactorMetrics, DiversityMetrics, ResponseTimeMetrics, ActivityMetrics, SustainabilityMetrics, SecurityMetrics, HealthMetrics, HealthData (actual types from codebase)
  - index.test.ts: Rewritten to test CLI structure and URL parsing, removed jest.Mocked and phantom function references

## Exceptional Checklist Status
- [x] Zero TODO/FIXME comments in shipped code
- [ ] README hooks reader in first 3 lines — Generic "One-command OSS project health analysis dashboard"
- [ ] Quick start works in <2 minutes — Not verified (tests blocked)
- [ ] All tests GREEN — Tests cannot run (vitest/esbuild mismatch)
- [ ] Test coverage >= 80% — Not verified (tests blocked)
- [ ] Zero TypeScript errors — Not verified (tests blocked)
- [ ] Zero ESLint warnings — Not verified
- [ ] At least 3 real-world examples in docs — Missing
- [ ] CHANGELOG up to date — Needs update
- [ ] Modern stack: Latest stable versions — Needs audit
- [ ] Unique value prop clearly stated — Generic description
- [ ] Performance: No obvious O(n²) loops — Not audited
- [ ] Security: No hardcoded secrets — OK, uses GITHUB_TOKEN

## Recommendation
**CONDITIONAL: Proceed with additional polish after resolving test environment issues.**

### To Complete:
1. Resolve vitest/esbuild version mismatch (fresh install or env cleanup)
2. Verify all tests pass
3. Improve README: Hook in first 3 lines, add 3 real-world examples, add comparison table
4. Audit runtime dependencies — consider replacing heavy deps with lighter alternatives where possible
5. Update CHANGELOG.md with fixes
6. Run full exceptional checklist verification

### If Blockers Cannot Be Resolved:
Consider deprecation if test environment issues persist beyond reasonable effort. The project is fundamentally different from polished zero-dep tools — it's a heavy CLI requiring GitHub API access and multiple runtime dependencies.