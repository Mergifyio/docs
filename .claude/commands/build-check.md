---
description: Run the full build and check suite to verify project health
allowed-tools: Bash(npm:*), Bash(./scripts/*)
---

# Build and Check Suite

Run all quality checks to verify the project builds correctly and passes all validations.

## Process

### Step 1: Format Check

First, verify code formatting without modifying files:

```bash
npm run format:check
```

**If this fails:** Run `npm run format` to auto-fix, then review changes.

### Step 2: Full Quality Check

Run the comprehensive check that includes TypeScript, ESLint, and Biome:

```bash
npm run check
```

This runs:
- `astro check` - Validates Astro components and MDX
- `eslint .` - Lints JavaScript/TypeScript
- `biome check .` - Additional code quality checks

**If this fails:** Review the specific errors and fix them before proceeding.

### Step 3: Unit Tests

Run the Vitest test suite:

```bash
npm run test
```

**If this fails:** Check the test output for failing assertions.

### Step 4: Production Build

Attempt a full production build to catch build-time issues:

```bash
npm run build
```

This is the most comprehensive check as it:
- Type-checks all TypeScript
- Compiles all MDX content
- Validates all imports and references
- Generates static output

**If this fails:** The error usually points to the specific file/line with the issue.

### Step 5: Link Validation (Optional)

For thorough validation, check for broken links:

```bash
./scripts/detect-broken-links.sh
```

**Note:** This requires a successful build to run against.

## Output Format

Report results as:

```markdown
## Build Check Results

| Check | Status | Notes |
|-------|--------|-------|
| Format | PASS/FAIL | Details if failed |
| Quality (check) | PASS/FAIL | Details if failed |
| Tests | PASS/FAIL | X tests, Y passed |
| Build | PASS/FAIL | Details if failed |
| Links | PASS/FAIL/SKIPPED | Details if failed |

### Issues Found
- [ ] Issue 1: Description and fix
- [ ] Issue 2: Description and fix

### Summary
All checks passed / X issues need attention before merge.
```

## Quick Reference

| Command | What It Checks |
|---------|----------------|
| `npm run format:check` | Code formatting |
| `npm run check` | Astro + ESLint + Biome |
| `npm run test` | Unit tests |
| `npm run build` | Full production build |
| `./scripts/detect-broken-links.sh` | Internal/external links |

## When to Run

- Before committing changes
- Before opening a pull request
- After merging/rebasing
- When CI fails and you need to debug locally
